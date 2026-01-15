"use client";

import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AggregatePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-2">Aggregate Rankings</h1>
          <p className="text-muted-foreground">Coming in Phase 6</p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
