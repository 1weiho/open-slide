import "./landing.css";

export default function Layout({ children }: LayoutProps<"/">) {
  return <div className="os-landing flex-1 flex flex-col">{children}</div>;
}
