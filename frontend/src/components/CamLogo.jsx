export default function CamLogo({ size = 32, color = "#FFFFFF" }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 14 L12 3 L15 3 L4 15 Z" fill={color} />
        <path d="M7 18 L17 7 L20 7 L9 19 Z" fill={color} opacity="0.8" />
        <path d="M12 22 L22 11 L24 11 L14 23 Z" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
}