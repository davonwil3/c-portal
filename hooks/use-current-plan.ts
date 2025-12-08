"use client"

import { useState, useEffect } from "react"
import { getCurrentAccount } from "@/lib/auth"

export type PlanTier = "basic" | "pro" | "studio"

export function useCurrentPlan(): PlanTier {
  const [plan, setPlan] = useState<PlanTier>("basic")

  useEffect(() => {
    async function loadPlan() {
      try {
        const account = await getCurrentAccount()
        if (account) {
          // Map database plan_tier to component tier
          // "free" -> "basic", "pro" -> "pro", "premium" -> "studio"
          if (account.plan_tier === "premium") {
            setPlan("studio")
          } else if (account.plan_tier === "pro") {
            setPlan("pro")
          } else {
            setPlan("basic")
          }
        }
      } catch (error) {
        console.error("Error loading plan:", error)
        setPlan("basic")
      }
    }

    loadPlan()
  }, [])

  return plan
}

