import { Outlet } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* ด้านซ้าย - ฟอร์ม */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background text-foreground">
        <div className="w-full max-w-xs">
          <Outlet />
        </div>
      </div>

      {/* ด้านขวา - แบรนดิ้ง */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-ring to-ring">
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
          
          {/* ลายพื้นหลัง - ปรับให้รองรับ dark mode */}
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' class='dark:fill-opacity-10'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} 
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-primary-foreground text-center max-w-md px-8">
              <div className="flex justify-center mb-8">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                  <MessageSquare className="h-16 w-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 text-white">BREEZ CHAT</h1>
              <p className="text-xl opacity-90 text-white">
                เชื่อมต่อกับเพื่อน ครอบครัว และธุรกิจในแพลตฟอร์มเดียวที่ราบรื่น
              </p>
              
              {/* สถิติ */}
              <div className="grid grid-cols-3 gap-4 mt-12">
                <div className="text-white">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm opacity-75">ผู้ใช้ที่ใช้งานอยู่</div>
                </div>
                <div className="text-white">
                  <div className="text-3xl font-bold">50K+</div>
                  <div className="text-sm opacity-75">ข้อความต่อวัน</div>
                </div>
                <div className="text-white">
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-sm opacity-75">เวลาให้บริการ</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* องค์ประกอบตกแต่ง - ปรับให้รองรับ dark mode */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground/10 dark:bg-primary-foreground/20 rounded-full blur-3xl animate-pulse" />
          <div 
            className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground/10 dark:bg-primary-foreground/20 rounded-full blur-3xl animate-pulse" 
            style={{ animationDelay: '1s' }} 
          />
        </div>
      </div>
    </div>
  )
}