import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogoutDialog } from '@/components/auth/logout-dialog'
import { PenTool, Search, Tag, Download, Clock, FileText } from 'lucide-react'
import { getNotes } from '@/lib/notes/actions'
import { Note } from '@/lib/db/schema/notes'

export default async function HomePage() {
    // 로그인 확인 - getUser()를 사용하여 서버에서 인증 확인
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // 최근 노트 조회 (최대 5개)
    let recentNotes: Note[] = []
    try {
        const allNotes = await getNotes()
        recentNotes = allNotes.slice(0, 5) // 최신 5개만 가져오기
    } catch (error) {
        console.error('최근 노트 조회 오류:', error)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                AI 메모장
                            </h1>
                            <p className="text-gray-600 mt-1">
                                안녕하세요, {user.email}님! 👋
                            </p>
                        </div>
                        <LogoutDialog />
                    </div>
                </div>

                {/* 환영 메시지 */}
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-900">
                            대시보드에 오신 것을 환영합니다!
                        </CardTitle>
                        <CardDescription className="text-blue-700">
                            AI의 도움을 받아 똑똑하게 메모를 관리해보세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Link href="/notes/new">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    새 메모 작성하기
                                </Button>
                            </Link>
                            <Link href="/ai-chat">
                                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                    <Search className="w-4 h-4 mr-2" />
                                    AI 대화
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* 기능 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                                <PenTool className="w-6 h-6 text-green-600" />
                            </div>
                            <CardTitle className="text-lg">메모 작성</CardTitle>
                            <CardDescription>
                                텍스트 및 음성으로 메모를 작성하세요
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                                <Tag className="w-6 h-6 text-purple-600" />
                            </div>
                            <CardTitle className="text-lg">AI 태깅</CardTitle>
                            <CardDescription>
                                AI가 자동으로 태그를 생성합니다
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                                <Search className="w-6 h-6 text-orange-600" />
                            </div>
                            <CardTitle className="text-lg">
                                스마트 검색
                            </CardTitle>
                            <CardDescription>
                                강력한 검색과 필터링 기능
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                                <Download className="w-6 h-6 text-blue-600" />
                            </div>
                            <CardTitle className="text-lg">
                                데이터 내보내기
                            </CardTitle>
                            <CardDescription>
                                메모를 다양한 형식으로 내보내기
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>

                {/* 최근 메모 */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>최근 메모</CardTitle>
                                <CardDescription>
                                    {recentNotes.length > 0 
                                        ? `총 ${recentNotes.length}개의 최근 메모` 
                                        : '아직 작성된 메모가 없습니다'
                                    }
                                </CardDescription>
                            </div>
                            {recentNotes.length > 0 && (
                                <Link href="/notes">
                                    <Button variant="outline" size="sm">
                                        모든 메모 보기
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentNotes.length === 0 ? (
                            <div className="text-center py-12">
                                <PenTool className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    첫 번째 메모를 작성해보세요
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    AI가 자동으로 요약하고 태그를 생성해드립니다
                                </p>
                                <Link href="/notes/new">
                                    <Button>
                                        메모 작성하기
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentNotes.map((note) => (
                                    <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-medium text-gray-900 truncate">
                                                    {note.title}
                                                </h4>
                                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                    {note.content || '내용이 없습니다.'}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '알 수 없음'}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex-shrink-0">
                                                <Link href={`/notes/${note.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 푸터 */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex justify-end">
                        <p className="text-sm text-gray-500">
                            by 구미드래곤
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const metadata = {
    title: 'AI 메모장 - 똑똑한 메모 관리',
    description: 'AI의 도움을 받아 효율적으로 메모를 관리하세요'
}
