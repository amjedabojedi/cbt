import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backLink?: {
    to: string;
    label: string;
  };
}

export function PageHeader({ heading, subheading, icon, actions, backLink }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex flex-col">
        {backLink && (
          <Link to={backLink.to} className="flex items-center text-muted-foreground hover:text-primary mb-2 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {backLink.label}
          </Link>
        )}
        <div className="flex items-center">
          {icon && <div className="mr-3">{icon}</div>}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{heading}</h1>
            {subheading && (
              <p className="text-muted-foreground">{subheading}</p>
            )}
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}