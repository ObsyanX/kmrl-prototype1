import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Code, Database, UserCheck, Bug } from 'lucide-react';
import { useDeveloperTools } from '@/hooks/useDeveloperTools';

interface DeveloperPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperPanel = ({ isOpen, onClose }: DeveloperPanelProps) => {
  const { config, updateConfig, isDevelopment, developerLogin, seedDevelopmentData, debugLog } = useDeveloperTools();

  if (!isOpen || !isDevelopment) return null;

  const handleDeveloperLogin = async () => {
    debugLog('Attempting developer login');
    await developerLogin();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-white">Developer Tools</CardTitle>
              <Badge variant="outline" className="text-blue-300 border-blue-300">
                DEV MODE
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400">
              ✕
            </Button>
          </div>
          <CardDescription className="text-gray-300">
            Development utilities for AGAMI Platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Quick Actions</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleDeveloperLogin}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="w-4 h-4" />
                <span>Dev Login</span>
              </Button>
              
              <Button 
                onClick={seedDevelopmentData}
                variant="outline" 
                className="flex items-center space-x-2 border-slate-600 text-white hover:bg-slate-800"
              >
                <Database className="w-4 h-4" />
                <span>Seed Data</span>
              </Button>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Bug className="w-4 h-4" />
              <span>Debug Configuration</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="debug-mode" className="text-white">Debug Mode</Label>
                  <p className="text-sm text-gray-400">Enable console debugging</p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={config.debugMode}
                  onCheckedChange={(checked) => updateConfig({ debugMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="mock-data" className="text-white">Mock Data</Label>
                  <p className="text-sm text-gray-400">Use simulated train and scheduling data</p>
                </div>
                <Switch
                  id="mock-data"
                  checked={config.mockData}
                  onCheckedChange={(checked) => updateConfig({ mockData: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="bypass-email" className="text-white">Bypass Email Confirmation</Label>
                  <p className="text-sm text-gray-400">Skip email verification in development</p>
                </div>
                <Switch
                  id="bypass-email"
                  checked={config.bypassEmailConfirmation}
                  onCheckedChange={(checked) => updateConfig({ bypassEmailConfirmation: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="allow-any-email" className="text-white">Allow Any Email</Label>
                  <p className="text-sm text-gray-400">Accept Gmail and other email domains</p>
                </div>
                <Switch
                  id="allow-any-email"
                  checked={config.allowAnyEmail}
                  onCheckedChange={(checked) => updateConfig({ allowAnyEmail: checked })}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Development Status</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Environment: <span className="text-blue-300">Development</span></p>
              <p>• Debug Mode: <span className={config.debugMode ? "text-green-300" : "text-gray-400"}>{config.debugMode ? "Enabled" : "Disabled"}</span></p>
              <p>• Mock Data: <span className={config.mockData ? "text-green-300" : "text-gray-400"}>{config.mockData ? "Enabled" : "Disabled"}</span></p>
              <p>• Email Bypass: <span className={config.bypassEmailConfirmation ? "text-green-300" : "text-gray-400"}>{config.bypassEmailConfirmation ? "Enabled" : "Disabled"}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
