import { LottieRefCurrentProps } from 'lottie-react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Dynamically import Lottie only when needed
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const MapAnimated = () => {
  const [animationData, setAnimationData] = useState<unknown>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null); // Use the correct type from lottie-react

  // Lazy load the animation JSON only when the component mounts
  useEffect(() => {
    const loadAnimation = async () => {
      // eslint-disable-next-line @next/next/no-assign-module-variable
      const module = await import('@shared/lottie/lottie-map.json');
      setAnimationData(module.default); // ✅ Extract default
    };
    void loadAnimation();
  }, []);

  // Set the animation speed when the animation data is loaded
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5); // Set the animation speed to 0.5x
    }
  }, [animationData]);

  return (
    <div className="absolute inset-0 -z-10">
      <Lottie
        lottieRef={lottieRef} // Pass the ref to the Lottie component
        className="h-full w-full"
        animationData={animationData}
      />
    </div>
  );
};

export default MapAnimated;
