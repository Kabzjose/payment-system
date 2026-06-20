interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "#F1F5F9" }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "#64748B" }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
