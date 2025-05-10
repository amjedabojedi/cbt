import { Brain, MessageCircle, BarChart3 } from 'lucide-react';

export default function CbtToolsSection() {
  return (
    <section className="cbt-tools-section py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Advanced Interactive CBT Tools</h2>
        <p className="text-center text-lg max-w-3xl mx-auto mb-12">
          Resilience CBT provides a comprehensive suite of tools for
          tracking emotions, thoughts, and behaviors designed around
          evidence-based approaches.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="cbt-tools-card p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Professional-Client Connection</h3>
            <p>
              Share your tracking data securely with your mental health professional.
            </p>
          </div>
          
          <div className="cbt-tools-card p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Advanced Emotion Tracking</h3>
            <p>
              Identify, record, and understand your emotions with our specialized tools.
            </p>
          </div>
          
          <div className="cbt-tools-card p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Personal Progress Insights</h3>
            <p>
              Track your progress with detailed analytics and visualizations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}