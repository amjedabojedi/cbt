import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </Button>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose prose-sm md:prose-base max-w-none">
            <p>Last updated: May 8, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>
              ResilienceHub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform for tracking emotions, thoughts, and behaviors.
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our platform, including:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, and profile information you provide during registration.</li>
              <li><strong>Health Information:</strong> Information related to your mental health, including emotion tracking, thought records, journal entries, and therapy goals.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited and features used.</li>
            </ul>
            
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our tracking tools (not therapy services)</li>
              <li>Personalize your experience</li>
              <li>Facilitate communication between mental health professionals and clients</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Ensure the security of our services</li>
            </ul>
            
            <h2>4. Information Sharing</h2>
            <p>We share information with:</p>
            <ul>
              <li><strong>Your Mental Health Professional:</strong> If you are a client, your mental health professional will have access to the information you input into our tracking tools to help them gain insights into your progress between sessions.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
            
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, please be aware that no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
            
            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have rights regarding your personal information, including:</p>
            <ul>
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your personal information</li>
              <li>Restriction of processing</li>
              <li>Data portability</li>
            </ul>
            
            <h2>7. Children's Privacy</h2>
            <p>
              Our platform is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
            </p>
            
            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at mail@rcrccanada.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}