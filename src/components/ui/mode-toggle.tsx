"use client"

import { Monitor, Moon, Sun } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ModeToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | null;
}

export function ModeToggle({ className, size = "icon" }: ModeToggleProps) {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className={cn("relative bg-background", className)} aria-label="切换外观">
          <Sun weight="fill" className="h-[19px] w-[19px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon weight="fill" className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="h-4 w-4" />浅色</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="h-4 w-4" />深色</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}><Monitor className="h-4 w-4" />跟随系统</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
