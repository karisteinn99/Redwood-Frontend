import { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

// Dynamically import Lottie only when needed
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const MapAnimated = () => {
  const [animationData, setAnimationData] = useState<any>(null);
  const lottieRef = useRef(null);

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
        loop={true}
      />
    </div>
  );
};

export default MapAnimated;
