import React from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

export default function TestComponent() {
  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tiny Steps Learning</h1>
      <Button>Test Button</Button>
    </Card>
  );
}