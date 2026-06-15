type LoginStatusProps = {
  message: string;
  tone: "idle" | "success" | "error";
};

const toneStyles: Record<LoginStatusProps["tone"], string> = {
  idle: "text-gray-600",
  success: "text-emerald-600",
  error: "text-red-600",
};

export function LoginStatus({ message, tone }: LoginStatusProps) {
  return <p className={`text-sm ${toneStyles[tone]}`}>{message}</p>;
}
