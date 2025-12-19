// Mock data for development
export const mockSites = [
  {
    id: '1',
    name: 'Stripe',
    url: 'https://stripe.com',
    description: 'Online payment processing for internet businesses. Stripe is a suite of payment APIs that powers commerce for businesses of all sizes.',
    short_description: 'Online payment processing for internet businesses',
    category: 'SaaS',
    tags: ['payments', 'fintech', 'API'],
    thumbnail_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    views: 15420,
    likes: 892,
    submitted_at: Date.now() - 86400000 * 5,
    status: 'approved'
  },
  {
    id: '2',
    name: 'Linear',
    url: 'https://linear.app',
    description: 'The issue tracking tool you\'ll enjoy using. Linear helps streamline software projects, sprints, tasks, and bug tracking.',
    short_description: 'Modern issue tracking for software teams',
    category: 'Productivity',
    tags: ['project-management', 'productivity', 'development'],
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    views: 12340,
    likes: 756,
    submitted_at: Date.now() - 86400000 * 3,
    status: 'approved'
  },
  {
    id: '3',
    name: 'Vercel',
    url: 'https://vercel.com',
    description: 'Develop. Preview. Ship. The best frontend teams use Vercel to build and deploy their websites and web applications.',
    short_description: 'Platform for frontend developers',
    category: 'Development',
    tags: ['hosting', 'deployment', 'frontend'],
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    views: 18920,
    likes: 1024,
    submitted_at: Date.now() - 86400000 * 7,
    status: 'approved'
  },
  {
    id: '4',
    name: 'Notion',
    url: 'https://notion.so',
    description: 'One workspace. Every team. Notion is the connected workspace where better, faster work happens.',
    short_description: 'All-in-one workspace for notes and collaboration',
    category: 'Productivity',
    tags: ['notes', 'collaboration', 'workspace'],
    thumbnail_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    views: 21500,
    likes: 1340,
    submitted_at: Date.now() - 86400000 * 10,
    status: 'approved'
  },
  {
    id: '5',
    name: 'Figma',
    url: 'https://figma.com',
    description: 'Figma connects everyone in the design process so teams can deliver better products, faster.',
    short_description: 'Collaborative interface design tool',
    category: 'Design',
    tags: ['design', 'collaboration', 'UI/UX'],
    thumbnail_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    views: 19800,
    likes: 1156,
    submitted_at: Date.now() - 86400000 * 12,
    status: 'approved'
  },
  {
    id: '6',
    name: 'Framer',
    url: 'https://framer.com',
    description: 'Design and publish modern sites with Framer. Start with AI, design on a freeform canvas, and publish with ease.',
    short_description: 'Design and publish websites with AI',
    category: 'Design',
    tags: ['design', 'website-builder', 'AI'],
    thumbnail_url: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80',
    views: 14200,
    likes: 823,
    submitted_at: Date.now() - 86400000 * 2,
    status: 'approved'
  },
  {
    id: '7',
    name: 'Supabase',
    url: 'https://supabase.com',
    description: 'The open source Firebase alternative. Build in a weekend, scale to millions.',
    short_description: 'Open source Firebase alternative',
    category: 'Development',
    tags: ['database', 'backend', 'open-source'],
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    views: 16700,
    likes: 945,
    submitted_at: Date.now() - 86400000 * 8,
    status: 'approved'
  },
  {
    id: '8',
    name: 'Raycast',
    url: 'https://raycast.com',
    description: 'Raycast is a blazingly fast, totally extendable launcher. It lets you complete tasks, calculate, share common links, and much more.',
    short_description: 'Blazingly fast productivity launcher',
    category: 'Productivity',
    tags: ['productivity', 'macOS', 'launcher'],
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    views: 11200,
    likes: 678,
    submitted_at: Date.now() - 86400000 * 4,
    status: 'approved'
  }
];

export const categories = [
  'All',
  'SaaS',
  'Productivity',
  'Development',
  'Design',
  'E-commerce',
  'Marketing',
  'Education'
];

export const featuredSites = mockSites.slice(0, 3);
