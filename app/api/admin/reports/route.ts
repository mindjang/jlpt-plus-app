import { NextRequest, NextResponse } from 'next/server'
import { getAllReports, updateReportStatus } from '@/lib/firebase/firestore/reports'
import { requireAuth } from '@/lib/firebase/auth-middleware'

/**
 * GET /api/admin/reports - 모든 신고 가져오기 (관리자용)
 */
export async function GET(request: NextRequest) {
  try {
    // 프로덕션에서는 인증 필요
    if (process.env.NODE_ENV === 'production') {
      await requireAuth(request)
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'pending' | 'reviewed' | 'resolved' | 'dismissed' | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    const reports = await getAllReports({
      status: status || undefined,
      limit,
    })

    return NextResponse.json({
      success: true,
      reports,
    })
  } catch (error) {
    console.error('[API] Error fetching reports:', error)
    return NextResponse.json(
      { error: '신고 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/reports - 신고 상태 업데이트 (관리자용)
 */
export async function PATCH(request: NextRequest) {
  try {
    // 프로덕션에서는 인증 필요
    if (process.env.NODE_ENV === 'production') {
      await requireAuth(request)
    }

    const body = await request.json()
    const { reportId, status, adminNote } = body

    if (!reportId) {
      return NextResponse.json(
        { error: '신고 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!status || !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: '올바른 상태를 지정해주세요.' },
        { status: 400 }
      )
    }

    await updateReportStatus(reportId, status, adminNote)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[API] Error updating report status:', error)
    return NextResponse.json(
      { error: '신고 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
