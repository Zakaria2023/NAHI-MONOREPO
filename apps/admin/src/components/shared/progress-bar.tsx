type ProgressBarProps = {
  /** 0..1 */
  value: number;
};

const WIDTHS = ["w-0", "w-1/12", "w-2/12", "w-3/12", "w-4/12", "w-5/12", "w-6/12", "w-7/12", "w-8/12", "w-9/12", "w-10/12", "w-11/12", "w-full"];

export const ProgressBar = ({ value }: ProgressBarProps) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-hover">
    <div className={`h-full rounded-full ${value >= 1 ? "bg-success" : "bg-primary"} ${WIDTHS[Math.round(Math.min(1, Math.max(0, value)) * 12)]}`} />
  </div>
);
