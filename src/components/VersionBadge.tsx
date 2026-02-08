import React, { useState } from 'react';
import { BUILD_VERSION, BUILD_TIMESTAMP, BUILD_FEATURES } from '../BUILD_VERSION';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export function VersionBadge() {
  const [showDetails, setShowDetails] = useState(false);
  
  // Parse timestamp for display
  const buildDate = new Date(BUILD_TIMESTAMP);
  const formattedDate = buildDate.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <>
      {/* Floating version badge */}
      <div 
        className="cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setShowDetails(true)}
        title="Click to see build details"
      >
        <Badge 
          variant="outline" 
          className="bg-white/90 backdrop-blur-sm border-gray-300 shadow-lg text-xs font-mono px-3 py-1.5"
        >
          🏗️ {BUILD_VERSION}
        </Badge>
      </div>
      
      {/* Version details dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Build information</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Version info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Version:</span>
                <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                  {BUILD_VERSION}
                </code>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Build timestamp:</span>
                <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                  {formattedDate}
                </code>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Environment:</span>
                <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                  {window.location.hostname}
                </code>
              </div>
            </div>
            
            {/* Features */}
            <div>
              <h3 className="font-medium mb-2">Features in this build:</h3>
              <ul className="space-y-1 text-sm">
                {BUILD_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="flex-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Comparison info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="font-medium mb-1">💡 Deployment verification:</div>
              <div className="text-gray-700">
                If you see the same version on <strong>wonderelo.com</strong> and in <strong>Figma Make preview</strong>, 
                you're using the same code.
              </div>
            </div>
            
            {/* Console output */}
            <div className="text-xs text-gray-500">
              Open browser console (F12) to see detailed build information.
            </div>
            
            {/* Debug mode info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <div className="font-medium mb-1">🔧 Debug mode:</div>
              <div className="text-gray-700 mb-2">
                Enable verbose logging in browser console:
              </div>
              <code className="block bg-white px-3 py-2 rounded border text-xs font-mono">
                window.debug.enable()
              </code>
              <div className="text-xs text-gray-600 mt-1">
                Disable with: <code>window.debug.disable()</code>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}