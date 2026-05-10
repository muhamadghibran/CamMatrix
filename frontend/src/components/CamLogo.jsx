export default function CamLogo({ size = 32, color = "#FFFFFF" }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 8 C 6 14 14 16 22 13 C 14 14 8 10 3 4 Z" fill={color} />
        <path d="M2 12 C 7 18 15 20 23 17 C 15 18 9 14 4 8 Z" fill={color} opacity="0.85" />
        <path d="M3 16 C 8 22 16 24 24 21 C 16 22 10 18 5 12 Z" fill={color} opacity="0.7" />
      </svg>
    </div>
  );
}