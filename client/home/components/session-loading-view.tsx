import { useViewportPageLayout } from "@/components/app-layout";
import { LoadingScreen } from "@/components/loading-screen";

interface SessionLoadingViewProps {
  domain: string;
}

export function SessionLoadingView({ domain }: SessionLoadingViewProps) {
  useViewportPageLayout();
  return <LoadingScreen message={`Preparing ${domain}`} />;
}
