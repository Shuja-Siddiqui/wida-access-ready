import { LoadingScreen } from "@/components/loading-screen";

interface SessionLoadingViewProps {
  domain: string;
}

export function SessionLoadingView({ domain }: SessionLoadingViewProps) {
  return <LoadingScreen fullHeight={false} message={`Preparing ${domain}`} />;
}
