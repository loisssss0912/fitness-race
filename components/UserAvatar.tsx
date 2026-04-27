const gradients = [
  'from-[#ffd166] via-[#ff8fab] to-[#7dd3fc]',
  'from-[#7dd3fc] via-[#a78bfa] to-[#f0abfc]',
  'from-[#fca5a5] via-[#fdba74] to-[#fde68a]',
  'from-[#86efac] via-[#5eead4] to-[#93c5fd]',
  'from-[#c4b5fd] via-[#f9a8d4] to-[#fef3c7]',
  'from-[#f9a8d4] via-[#f0abfc] to-[#a5b4fc]',
  'from-[#fdba74] via-[#fef08a] to-[#86efac]'
];

export function UserAvatar({ name, index = 0, size = 'md' }: { name: string; index?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-24 w-24 text-3xl' : size === 'sm' ? 'h-11 w-11 text-sm' : 'h-16 w-16 text-xl';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} p-[2px] shadow-lg shadow-black/30`}>
      <div className="grid h-full w-full place-items-center rounded-full bg-[#101522]/90 font-black text-white ring-1 ring-white/18">{name.slice(0, 1)}</div>
    </div>
  );
}
