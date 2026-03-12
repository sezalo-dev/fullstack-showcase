type PublicPlaceholderProps = {
  title: string;
  description: string;
};

export function PublicPlaceholder({ title, description }: PublicPlaceholderProps) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <div className="rounded-[32px] border border-[#dbe7dc] bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full border border-[#dbe7dc] bg-[#f4f8f4] px-4 py-2 text-sm font-medium text-[#2f6b3d]">
          Public repository placeholder
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#16301d]">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      </div>
    </section>
  );
}
