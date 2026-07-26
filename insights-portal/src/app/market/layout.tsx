import { SubNavigation } from "@/components/sub-navigation";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNavigation
        label="Market views"
        links={[
          { href: "/market", text: "Dashboard" },
          { href: "/market/what-if", text: "What-if" },
        ]}
      />
      {children}
    </>
  );
}
