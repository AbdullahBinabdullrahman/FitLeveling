import './globals.css';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = { title:'LEVELUP FITNESS', description:'Train. Progress. Level up.', manifest:'/manifest.webmanifest', icons:{apple:'/icons/icon-180.png'}, appleWebApp:{capable:true,title:'LevelUp',statusBarStyle:'black-translucent'} };
export const viewport: Viewport = { themeColor:'#080d19', width:'device-width', initialScale:1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
