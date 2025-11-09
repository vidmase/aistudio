// Hero image data - This would normally be a proper image file
// For now, we'll use CSS to create a similar atmospheric effect
export const heroImageStyle = {
  backgroundImage: `
    linear-gradient(
      135deg,
      rgba(15, 15, 35, 0.8) 0%,
      rgba(26, 26, 46, 0.7) 25%,
      rgba(22, 33, 62, 0.6) 50%,
      rgba(139, 116, 95, 0.4) 75%,
      rgba(218, 165, 32, 0.3) 100%
    ),
    radial-gradient(
      ellipse at center,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 30%,
      transparent 70%
    )
  `,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};