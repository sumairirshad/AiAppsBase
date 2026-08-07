import {
  Sparkles, LayoutGrid, Flame, Star, Trophy, Crown, Bot, Layers, LayoutTemplate,
  Component, LayoutDashboard, Puzzle, Atom, Triangle, Hexagon, Code2, Server,
  Smartphone, Globe, ShoppingBag, BookOpen, Terminal, Newspaper, GitCommitHorizontal,
  Users, LifeBuoy, Map, Activity, Info, Briefcase, Building2, Mail, Handshake, Share2,
  Store, Megaphone, Github, Twitter, MessageCircle, Linkedin, Youtube, HelpCircle,
  BarChart3, Receipt, Settings, Wallet, Download, Package,
  Bell, FileText, ClipboardList, ShieldCheck, DollarSign,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  Sparkles, LayoutGrid, Flame, Star, Trophy, Crown, Bot, Layers, LayoutTemplate,
  Component, LayoutDashboard, Puzzle, Atom, Triangle, Hexagon, Code2, Server,
  Smartphone, Globe, ShoppingBag, BookOpen, Terminal, Newspaper, GitCommitHorizontal,
  Users, LifeBuoy, Map, Activity, Info, Briefcase, Building2, Mail, Handshake, Share2,
  Store, Megaphone, Github, Twitter, MessageCircle, Linkedin, Youtube,
  BarChart3, Receipt, Settings, Wallet, Download, Package,
  Bell, FileText, ClipboardList, ShieldCheck, DollarSign,
}

export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = (name && icons[name]) || HelpCircle
  return <C className={className} />
}
