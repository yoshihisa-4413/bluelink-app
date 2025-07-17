import { useState, useEffect } from 'react'
import Layout from './Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react'

const MyTimetable = ({ user, onLogout }) => {
  const [timetable, setTimetable] = useState({})
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({ subject: '', room: '', professor: '' })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const timeSlots = [
    { period: 1, start: '08:45', end: '10:15', name: '1限' },
    { period: 2, start: '10:30', end: '12:00', name: '2限' },
    { period: 3, start: '13:00', end: '14:30', name: '3限' },
    { period: 4, start: '14:45', end: '16:15', name: '4限' },
    { period: 5, start: '16:30', end: '18:00', name: '5限' },
  ]

  const daysOfWeek = [
    { id: 1, name: '月', fullName: '月曜日', key: 'monday' },
    { id: 2, name: '火', fullName: '火曜日', key: 'tuesday' },
    { id: 3, name: '水', fullName: '水曜日', key: 'wednesday' },
    { id: 4, name: '木', fullName: '木曜日', key: 'thursday' },
    { id: 5, name: '金', fullName: '金曜日', key: 'friday' },
  ]

  useEffect(() => {
    loadTimetable()
  }, [])

  const loadTimetable = async () => {
    try {
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/timetable', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        const timetableData = {}
        
        // APIから取得したデータを整理
        data.timetables.forEach(item => {
          const dayId = daysOfWeek.find(d => d.key === item.day_of_week)?.id
          if (dayId) {
            if (!timetableData[dayId]) {
              timetableData[dayId] = {}
            }
            timetableData[dayId][item.period] = {
              id: item.id,
              subject: item.subject_name,
              room: item.room,
              professor: item.professor || ''
            }
          }
        })
        
        setTimetable(timetableData)
      } else {
        console.error('時間割の読み込みに失敗しました')
      }
    } catch (error) {
      console.error('時間割の読み込み中にエラーが発生しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveClass = async (day, period, classData) => {
    try {
      const dayKey = daysOfWeek.find(d => d.id === day)?.key
      if (!dayKey) return false

      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          day_of_week: dayKey,
          period: period,
          subject_name: classData.subject || '',
          room: classData.room || ''
        })
      })

      return response.ok
    } catch (error) {
      console.error('授業の保存中にエラーが発生しました:', error)
      return false
    }
  }

  const saveTimetable = async () => {
    setIsSaving(true)
    setMessage('')
    
    try {
      let allSuccess = true
      
      // 各授業を個別に保存
      for (const [dayId, periods] of Object.entries(timetable)) {
        for (const [period, classData] of Object.entries(periods)) {
          const success = await saveClass(parseInt(dayId), parseInt(period), classData)
          if (!success) {
            allSuccess = false
          }
        }
      }

      if (allSuccess) {
        setMessage('時間割を保存しました')
        // 保存後に最新データを再読み込み
        await loadTimetable()
      } else {
        setMessage('一部の授業の保存に失敗しました')
      }
    } catch (error) {
      console.error('時間割の保存中にエラーが発生しました:', error)
      setMessage('保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
      // 3秒後にメッセージを消去
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleAddClass = (day, period) => {
    setEditingClass({ day, period, isNew: true })
    setFormData({ subject: '', room: '', professor: '' })
    setIsDialogOpen(true)
  }

  const handleEditClass = (day, period, classData) => {
    setEditingClass({ day, period, isNew: false })
    setFormData({ 
      subject: classData.subject, 
      room: classData.room || '', 
      professor: classData.professor || '' 
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClass = async (day, period) => {
    try {
      const dayKey = daysOfWeek.find(d => d.id === day)?.key
      if (!dayKey) return

      // 空のデータで保存（削除）
      const response = await fetch('https://bluelink-app-lx59.onrender.com/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          day_of_week: dayKey,
          period: period,
          subject_name: '',
          room: ''
        })
      })

      if (response.ok) {
        // ローカル状態を更新
        const newTimetable = { ...timetable }
        if (newTimetable[day] && newTimetable[day][period]) {
          delete newTimetable[day][period]
          if (Object.keys(newTimetable[day]).length === 0) {
            delete newTimetable[day]
          }
        }
        setTimetable(newTimetable)
        setMessage('授業を削除しました')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('授業の削除中にエラーが発生しました:', error)
      setMessage('削除中にエラーが発生しました')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSaveClass = async () => {
    if (!formData.subject.trim()) return

    const { day, period } = editingClass
    
    try {
      const success = await saveClass(day, period, formData)
      
      if (success) {
        // ローカル状態を更新
        const newTimetable = { ...timetable }
        
        if (!newTimetable[day]) {
          newTimetable[day] = {}
        }
        
        newTimetable[day][period] = {
          id: newTimetable[day][period]?.id || null,
          subject: formData.subject.trim(),
          room: formData.room.trim(),
          professor: formData.professor.trim()
        }
        
        setTimetable(newTimetable)
        setMessage('授業を保存しました')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('保存に失敗しました')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('授業の保存中にエラーが発生しました:', error)
      setMessage('保存中にエラーが発生しました')
      setTimeout(() => setMessage(''), 3000)
    }
    
    setIsDialogOpen(false)
    setEditingClass(null)
    setFormData({ subject: '', room: '', professor: '' })
  }

  const getClassData = (day, period) => {
    return timetable[day] && timetable[day][period] ? timetable[day][period] : null
  }

  if (isLoading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">時間割を読み込み中...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">マイ時間割</h2>
            <p className="text-gray-600">あなたの時間割を管理できます</p>
          </div>
          <Button 
            onClick={saveTimetable} 
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.includes('失敗') || message.includes('エラー') 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`}>
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>時間割表</CardTitle>
            <CardDescription>授業をクリックして編集、空きコマをクリックして追加</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-sm font-medium">時限</th>
                    {daysOfWeek.map((day) => (
                      <th key={day.id} className="border p-2 bg-gray-50 text-sm font-medium min-w-32">
                        {day.fullName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={slot.period}>
                      <td className="border p-2 bg-gray-50 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{slot.name}</div>
                          <div className="text-xs text-gray-500">
                            {slot.start}-{slot.end}
                          </div>
                        </div>
                      </td>
                      {daysOfWeek.map((day) => {
                        const classData = getClassData(day.id, slot.period)
                        return (
                          <td key={`${day.id}-${slot.period}`} className="border p-1">
                            {classData ? (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 min-h-16 relative group">
                                <div className="text-sm font-medium text-blue-900">{classData.subject}</div>
                                {classData.room && (
                                  <div className="text-xs text-blue-700">{classData.room}</div>
                                )}
                                {classData.professor && (
                                  <div className="text-xs text-blue-600">{classData.professor}</div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditClass(day.id, slot.period, classData)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteClass(day.id, slot.period)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className="min-h-16 border-2 border-dashed border-gray-200 rounded p-2 flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                onClick={() => handleAddClass(day.id, slot.period)}
                              >
                                <Plus className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 授業編集ダイアログ */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass?.isNew ? '授業を追加' : '授業を編集'}
              </DialogTitle>
              <DialogDescription>
                授業の詳細を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">授業名 *</Label>
                <Input
                  id="subject"
                  placeholder="例: 数学"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">教室</Label>
                <Input
                  id="room"
                  placeholder="例: A101"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professor">教授</Label>
                <Input
                  id="professor"
                  placeholder="例: 田中教授"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveClass} disabled={!formData.subject.trim()}>
                  保存
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default MyTimetable

