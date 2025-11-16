import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@components/ui/card";

const TestCardVariants = () => {
  return (
    <div className="space-y-6">
      <Card variant="default" shadow="medium" hoverEffect={true}>
        <CardHeader>
          <CardTitle>Default Card</CardTitle>
        </CardHeader>
        <CardContent>
          This is a default card with medium shadow and hover effect.
        </CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>

      <Card variant="outlined" shadow="none">
        <CardHeader>
          <CardTitle>Outlined Card</CardTitle>
        </CardHeader>
        <CardContent>
          This is an outlined card with no shadow.
        </CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>

      <Card variant="elevated" shadow="large" hoverEffect={true}>
        <CardHeader>
          <CardTitle>Elevated Card</CardTitle>
        </CardHeader>
        <CardContent>
          This is an elevated card with large shadow and hover effect.
        </CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>

      <Card variant="flat" shadow="small">
        <CardHeader>
          <CardTitle>Flat Card</CardTitle>
        </CardHeader>
        <CardContent>
          This is a flat card with small shadow.
        </CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    </div>
  );
};

export default TestCardVariants;