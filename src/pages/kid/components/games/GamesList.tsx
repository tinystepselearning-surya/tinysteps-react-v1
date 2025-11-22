import type { FC } from 'react';
import { Card } from '@components/ui/card';

interface GamesListProps {
  kidId?: string;
}

const GamesList: FC<GamesListProps> = () => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">Games (Removed)</h3>
      <p className="text-sm text-muted-foreground">Kid game features and data have been removed from this deployment.</p>
    </Card>
  );
};

export default GamesList;