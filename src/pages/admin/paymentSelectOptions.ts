export type PaymentUserOption = {
  id: string;
  displayName?: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneLocal?: string;
  phoneNormalized?: string;
};

export type ParentPaymentOptionRow = {
  parentId: string;
  parentName: string;
  studentNames?: string[];
};

export type TeacherPaymentOptionRow = {
  teacherId: string;
  teacherName: string;
};

export type PaymentSelectOption<TUser extends PaymentUserOption> = {
  id: string;
  label: string;
  primaryLabel: string;
  user: TUser | null;
};

const pickContact = (user?: PaymentUserOption | null): string => {
  if (!user) return '';
  return (
    String(user.email || '').trim() ||
    String(user.phone || '').trim() ||
    String(user.phoneLocal || '').trim() ||
    String(user.phoneNormalized || '').trim()
  );
};

const pickDisplayName = (
  user?: PaymentUserOption | null,
  fallbackName?: string,
  fallbackId?: string,
): string => {
  return (
    String(user?.displayName || '').trim() ||
    String(user?.name || '').trim() ||
    String(user?.email || '').trim() ||
    String(fallbackName || '').trim() ||
    String(fallbackId || '').trim()
  );
};

const buildOptionLabel = (parts: Array<string | undefined>): string =>
  parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' • ');

const mergeOptions = <TUser extends PaymentUserOption>(
  sources: Array<PaymentSelectOption<TUser>>,
): Array<PaymentSelectOption<TUser>> => {
  const byId = new Map<string, PaymentSelectOption<TUser>>();

  sources.forEach((option) => {
    if (!option.id) return;
    const existing = byId.get(option.id);
    if (!existing) {
      byId.set(option.id, option);
      return;
    }

    byId.set(option.id, {
      id: option.id,
      primaryLabel:
        option.primaryLabel.length > existing.primaryLabel.length
          ? option.primaryLabel
          : existing.primaryLabel,
      label: option.label.length > existing.label.length ? option.label : existing.label,
      user: existing.user || option.user,
    });
  });

  return Array.from(byId.values());
};

// ParentPayments temporarily replaces its loaded month scope with the selected parent
// while fetching details. Preserve the durable month-scoped options so the admin can
// immediately move Parent A -> Parent B without needing a remount/login. The memory is
// cleared whenever the parent payment scope is reset (initial mount/month change).
const parentOptionMemory = new Map<string, PaymentSelectOption<PaymentUserOption>>();

export const resetParentPaymentSelectOptionMemory = (): void => {
  parentOptionMemory.clear();
};

export const buildParentPaymentSelectOptions = <TUser extends PaymentUserOption>({
  loadedParents,
  searchResults,
  tableRows,
  selectedParentId,
}: {
  loadedParents: TUser[];
  searchResults: TUser[];
  tableRows: ParentPaymentOptionRow[];
  selectedParentId?: string;
}): Array<PaymentSelectOption<TUser>> => {
  const normalizedSelectedParentId = String(selectedParentId || '').trim();

  // ParentPayments clears both loaded parents and table rows when the page/month scope
  // is reset. Treat that transition as the lifecycle boundary for remembered options.
  if (!normalizedSelectedParentId && loadedParents.length === 0 && tableRows.length === 0) {
    parentOptionMemory.clear();
  }

  const rowById = new Map(tableRows.map((row) => [row.parentId, row]));
  const userById = new Map(
    [...loadedParents, ...searchResults].filter((user) => user.id).map((user) => [user.id, user]),
  );

  const buildParentOption = (parentId: string): PaymentSelectOption<TUser> | null => {
    const trimmedId = String(parentId || '').trim();
    if (!trimmedId) return null;
    const user = userById.get(trimmedId) || null;
    const row = rowById.get(trimmedId);
    const primaryLabel = pickDisplayName(user, row?.parentName, trimmedId);
    const studentLabel =
      row?.studentNames
        ?.map((name) => String(name || '').trim())
        .filter(Boolean)
        .join(', ') || '';
    const contact = pickContact(user);
    return {
      id: trimmedId,
      primaryLabel,
      label: buildOptionLabel([primaryLabel, studentLabel, contact]),
      user,
    };
  };

  const candidateIds = [
    ...searchResults.map((user) => user.id),
    ...loadedParents.map((user) => user.id),
    ...tableRows.map((row) => row.parentId),
    normalizedSelectedParentId,
  ];

  const currentOptions = mergeOptions(
    candidateIds
      .map((parentId) => buildParentOption(parentId))
      .filter((option): option is PaymentSelectOption<TUser> => Boolean(option)),
  );

  // Search results are intentionally ephemeral. Persist only options that belong to the
  // loaded/table scope or the currently selected parent. This prevents a historical search
  // from polluting future month scopes while keeping the original page options available
  // after ParentPayments narrows its Firestore reads to one selected parent.
  const durableParentIds = new Set(
    [
      ...loadedParents.map((user) => user.id),
      ...tableRows.map((row) => row.parentId),
      normalizedSelectedParentId,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  );

  currentOptions.forEach((option) => {
    if (!durableParentIds.has(option.id)) return;
    const previous = parentOptionMemory.get(option.id);
    const merged = previous
      ? mergeOptions<PaymentUserOption>([previous, option])[0]
      : (option as PaymentSelectOption<PaymentUserOption>);
    parentOptionMemory.set(option.id, merged);
  });

  const rememberedOptions = Array.from(parentOptionMemory.values()) as Array<
    PaymentSelectOption<TUser>
  >;

  return mergeOptions([...rememberedOptions, ...currentOptions]);
};

export const buildTeacherPaymentSelectOptions = <TUser extends PaymentUserOption>({
  loadedTeachers,
  searchResults,
  rows,
  selectedTeacherId,
}: {
  loadedTeachers: TUser[];
  searchResults: TUser[];
  rows: TeacherPaymentOptionRow[];
  selectedTeacherId?: string;
}): Array<PaymentSelectOption<TUser>> => {
  const rowById = new Map(rows.map((row) => [row.teacherId, row]));
  const userById = new Map(
    [...loadedTeachers, ...searchResults].filter((user) => user.id).map((user) => [user.id, user]),
  );

  const buildTeacherOption = (teacherId: string): PaymentSelectOption<TUser> | null => {
    const trimmedId = String(teacherId || '').trim();
    if (!trimmedId) return null;
    const user = userById.get(trimmedId) || null;
    const row = rowById.get(trimmedId);
    const primaryLabel = pickDisplayName(user, row?.teacherName, trimmedId);
    const contact = pickContact(user);
    return {
      id: trimmedId,
      primaryLabel,
      label: buildOptionLabel([primaryLabel, contact]),
      user,
    };
  };

  const candidateIds = [
    ...searchResults.map((user) => user.id),
    ...loadedTeachers.map((user) => user.id),
    ...rows.map((row) => row.teacherId),
    selectedTeacherId || '',
  ];

  return mergeOptions(
    candidateIds
      .map((teacherId) => buildTeacherOption(teacherId))
      .filter((option): option is PaymentSelectOption<TUser> => Boolean(option)),
  );
};
