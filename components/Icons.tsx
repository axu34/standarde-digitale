import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function GrIcon({
  file,
  size,
  className,
}: {
  file: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", size == null && "size-6", className)}
      style={{
        ...(size != null ? { width: size, height: size } : {}),
        WebkitMask: `url(/icons/${file}) center / contain no-repeat`,
        mask: `url(/icons/${file}) center / contain no-repeat`,
      }}
    />
  );
}

export function IconMenu({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_MENU.svg" size={size} className={className} />;
}
export function IconClose({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_CANCEL.svg" size={size} className={className} />;
}
export function IconPhone({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_PHONE.svg" size={size} className={className} />;
}
export function IconCar({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_CAR.svg" size={size} className={className} />;
}
export function IconCheck({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_CONFIRM.svg" size={size} className={className} />;
}
export function IconList({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_LIST_CHECK.svg" size={size} className={className} />;
}
export function IconDealer({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_CAR_DEALERSHIP.svg" size={size} className={className} />;
}
export function IconClock({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_ALARM_CLOCK.svg" size={size} className={className} />;
}
export function IconArrowRight({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_ARROW_RIGHT_1.svg" size={size} className={className} />;
}
export function IconArrowDown({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_ARROW_DOWN_1.svg" size={size} className={className} />;
}
export function IconCancel({ size, className }: IconProps) {
  return <GrIcon file="GR_ICONS_24px_CANCEL.svg" size={size} className={className} />;
}
