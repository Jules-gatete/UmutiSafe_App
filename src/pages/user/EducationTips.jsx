import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Lock,
  Users,
  ShieldAlert,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { mockEducationTips } from '../../utils/mockData';

const iconMap = {
  AlertTriangle,
  Clock,
  Lock,
  Users,
  ShieldAlert,
  Heart,
};

export default function EducationTips() {
  const [expandedTips, setExpandedTips] = useState(new Set());

  const toggleTip = (tipId) => {
    const newExpanded = new Set(expandedTips);
    if (newExpanded.has(tipId)) {
      newExpanded.delete(tipId);
    } else {
      newExpanded.add(tipId);
    }
    setExpandedTips(newExpanded);
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Education & Safety Tips
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Learn how to handle and dispose of medicines safely
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockEducationTips.map((tip) => {
          const Icon = iconMap[tip.icon];
          const isExpanded = expandedTips.has(tip.id);

          return (
            <div key={tip.id} className="card hover:scale-105 transition-transform">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary-blue bg-opacity-10 dark:bg-accent-cta dark:bg-opacity-10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary-blue dark:text-accent-cta" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{tip.summary}</p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {tip.content}
                  </p>
                </div>
              )}

              <button
                onClick={() => toggleTip(tip.id)}
                className="mt-4 text-sm font-medium text-primary-blue dark:text-accent-cta hover:underline flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Read More
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card mt-8 bg-primary-blue text-white">
        <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
        <p className="mb-6 text-white text-opacity-90">
          Contact your local Community Health Worker or call our helpline for personalized
          guidance on medicine disposal and safety.
        </p>
        <div className="flex gap-4 flex-wrap">
          <a href="tel:+250788000000" className="btn-secondary">
            Call Helpline
          </a>
          <a href="/user/chw-interaction" className="btn-outline border-white text-white hover:bg-white hover:text-primary-blue">
            Contact CHW
          </a>
        </div>
      </div>
    </div>
  );
}
