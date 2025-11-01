type NavItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  active?: boolean;
  href?: string;
  onSelect?: () => void;
};

type OverridesConfig = {
  [key: string]: Partial<NavItem>;
};

export function buildNavItems(
  activeKey: string,
  options: {
    includeKeys: string[];
    overrides?: OverridesConfig;
  },
): NavItem[] {
  const { includeKeys, overrides = {} } = options;

  const baseNavItems: Record<string, NavItem> = {
    kids: {
      key: "kids",
      label: "Kids Zone",
      active: activeKey === "kids",
    },
    parents: {
      key: "parents",
      label: "Parent Dashboard",
      href: "/parents",
      active: activeKey === "parents",
    },
    homework: {
      key: "homework",
      label: "Homework",
      active: activeKey === "homework",
    },
    teachers: {
      key: "teachers",
      label: "Teacher Portal",
      href: "/roles/teacher",
      active: activeKey === "teachers",
    },
    rm: {
      key: "rm",
      label: "Learning Manager",
      href: "/roles/rm",
      active: activeKey === "rm",
    },
  };

  return includeKeys
    .map((key) => ({
      ...baseNavItems[key],
      ...(overrides[key] || {}),
    }));
}