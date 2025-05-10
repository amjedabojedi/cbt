import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <div className="prose prose-sm md:prose-base max-w-none">
            <p>Last updated: May 8, 2025</p>
            
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using the Resilience CBT platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
            </p>
            
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily use the Resilience CBT platform for personal, non-commercial therapeutic purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
            
            <h2>3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate, complete, and up-to-date information. You are responsible for safeguarding the password you use to access the platform and for any activities or actions under your password.
            </p>
            
            <h2>4. Therapist-Client Relationship</h2>
            <p>
              The Resilience CBT platform facilitates the therapist-client relationship but does not replace professional therapy. The platform should be used in conjunction with, not in place of, professional mental health services.
            </p>
            
            <h2>5. Medical Disclaimer</h2>
            <p>
              The platform is not intended to diagnose, treat, cure, or prevent any mental health condition. It is a tool to support cognitive behavioral therapy and should be used under the guidance of a qualified mental health professional.
            </p>
            
            <h2>6. Limitations</h2>
            <p>
              In no event shall Resilience CBT or its suppliers be liable for any damages arising out of the use or inability to use the platform, even if Resilience CBT has been notified of the possibility of such damages.
            </p>
            
            <h2>7. Accuracy of Materials</h2>
            <p>
              The materials on the Resilience CBT platform are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose.
            </p>
            
            <h2>8. Privacy</h2>
            <p>
              Your use of the New Horizon CBT platform is also governed by our Privacy Policy, which is incorporated by reference into these Terms of Service.
            </p>
            
            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms of Service.
            </p>
            
            <h2>10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws, without regard to its conflict of law provisions.
            </p>
            
            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. By continuing to access or use our platform after those revisions become effective, you agree to be bound by the revised terms.
            </p>
            
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at mail@resiliencec.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}