// Category color palette - Notion-inspired muted tones (light mode)
export const catColorsLight: string[] = [
  'linear-gradient(135deg, #487CA5, #5A93BE)',  // notion blue
  'linear-gradient(135deg, #548164, #6A9A7A)',  // notion green
  'linear-gradient(135deg, #CC782F, #D99050)',  // notion orange
  'linear-gradient(135deg, #8A67AB, #9E80BF)',  // notion purple
  'linear-gradient(135deg, #B35488, #C46E9C)',  // notion pink
  'linear-gradient(135deg, #C29343, #D0A55C)',  // notion yellow
  'linear-gradient(135deg, #976D57, #AB846E)',  // notion brown
  'linear-gradient(135deg, #C4554D, #D06C65)',  // notion red
  'linear-gradient(135deg, #787774, #908F8C)',  // notion gray
  'linear-gradient(135deg, #4A9B8E, #5DAFA2)',  // teal
  'linear-gradient(135deg, #5E81AC, #7494BA)',  // steel blue
  'linear-gradient(135deg, #8B7355, #9F876B)',  // warm brown
  'linear-gradient(135deg, #6B8E6B, #7FA27F)',  // sage green
  'linear-gradient(135deg, #7B6BA5, #8F80B8)',  // lavender
  'linear-gradient(135deg, #A0785A, #B38E70)',  // caramel
];

// Dark mode - Notion dark text colors as bar fills
export const catColorsDark: string[] = [
  'linear-gradient(135deg, #528BD6, #6BA0E5)',  // notion blue
  'linear-gradient(135deg, #5BA878, #70BD8D)',  // notion green
  'linear-gradient(135deg, #D68A48, #E4A060)',  // notion orange
  'linear-gradient(135deg, #9470C8, #A888DA)',  // notion purple
  'linear-gradient(135deg, #C75D8A, #D8769F)',  // notion pink
  'linear-gradient(135deg, #CDA048, #DBBF60)',  // notion yellow
  'linear-gradient(135deg, #B08874, #C09E8C)',  // notion brown
  'linear-gradient(135deg, #CC635C, #DC7B75)',  // notion red
  'linear-gradient(135deg, #A8A8A8, #B8B8B8)',  // notion gray
  'linear-gradient(135deg, #55B8AB, #6BCDBF)',  // teal
  'linear-gradient(135deg, #749DCE, #88B0DC)',  // steel blue
  'linear-gradient(135deg, #AA9577, #BCA98C)',  // warm brown
  'linear-gradient(135deg, #6AB86A, #7ECC7E)',  // sage green
  'linear-gradient(135deg, #9888D0, #AC9DE0)',  // lavender
  'linear-gradient(135deg, #C49D7A, #D5B190)',  // caramel
];

export function getCategoryColor(catIdx: number, isDark: boolean): string {
  const colors = isDark ? catColorsDark : catColorsLight;
  return colors[catIdx % colors.length];
}

// Task class border-left colors for weekly planner cards
export const taskClsColors: Record<string, string> = {
  'c-map': '#6366f1',
  'c-paper': '#f59e0b',
  'c-comm': '#10b981',
  'c-food': '#ec4899',
  'c-action': '#ef4444',
  'c-misc': '#8b5cf6',
  'c-cde': '#0ea5e9',
  'c-proj': '#0d9488',
  'c-zoomcamp': '#dc2626',
  'c-cert': '#059669',
  'c-course': '#7c3aed',
  'c-career': '#0284c7',
  'c-interview': '#be185d',
  'c-life': '#65a30d',
  'c-leetcode': '#d97706',
  'c-video': '#7c3aed',
  'c-event': '#d946ef',
  'c-diss': '#0891b2',
  'c-admin': '#6b21a8',
  'c-default': '#787774',
};
