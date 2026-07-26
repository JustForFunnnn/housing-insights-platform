import { SubNavigation } from "@/components/sub-navigation";

export default function EstimatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNavigation
        label="Estimator views"
        links={[
          { href: "/estimator", text: "Estimate" },
          { href: "/estimator/history", text: "History" },
          { href: "/estimator/compare", text: "Compare" },
        ]}
      />
      {children}
    </>
  );
}
