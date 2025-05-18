import React from 'react';
import featureFlowImage from '../../assets/image_1747581873634.png';

export default function FeatureFlowImage() {
  return (
    <div className="mb-16">
      <h3 className="text-xl font-semibold text-center mb-8">How ResilienceHub™ Works</h3>
      <div className="max-w-4xl mx-auto">
        <img 
          src={featureFlowImage} 
          alt="ResilienceHub™ Feature Usage Sequence" 
          className="w-full rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}