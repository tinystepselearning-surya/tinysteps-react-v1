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

export const buildParentPaymentSelectOptions = <TUser extends PaymentUserOption>({
  loadedParents,
  searchResults,
  tableRows,
  selectedParentId,
  preservedOptions = [],
}: {
  loadedParents: TUser[];
  searchResults: TUser[];
  tableRows: ParentPaymentOptionRow[];
  selectedParentId?: string;
  preservedOptions?: Array<PaymentSelectOption<TUser>>;
}): Array<PaymentSelectOption<TUser>> => {
  const normalizedSelectedParentId = String(selectedParentId || '').trim();

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
  return mergeOptions([...preservedOptions, ...currentOptions]);
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
