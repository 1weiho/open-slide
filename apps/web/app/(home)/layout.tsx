import './landing.css';

export default function Layout({ children }: LayoutProps<'/'>) {
  return <div className="os-landing relative flex flex-1 flex-col">{children}</div>;
}
