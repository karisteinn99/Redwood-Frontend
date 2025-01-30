import { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

// Dynamically import Lottie only when needed
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const MapAnimated = () => {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = useRef();

  // Lazy load the animation JSON only when the component mounts
  useEffect(() => {
    const loadAnimation = async () => {
      const module = await import('@shared/lottie/lottie-map.json');
      setAnimationData(module.default); // ✅ Extract default
    };
    void loadAnimation();
  }, []);

  return (
    <div className="size-screen absolute">
      <Lottie
        lottieRef={lottieRef}
        className="h-full w-full"
        animationData={animationData}
        speed={0.1}
        onDOMLoaded={() => {
          lottieRef.current.setSpeed(0.25);
        }}
      />
    </div>
  );
};

export default MapAnimated;
