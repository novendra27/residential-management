import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { residentService } from '@/services/resident.service'
import { useToast } from '@/hooks/useToast'

// ─── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  phone_number: z.string().min(1, 'No. HP wajib diisi'),
  is_contract: z.enum(['0', '1'], { message: 'Status hunian wajib dipilih' }),
  is_married: z.enum(['0', '1'], { message: 'Status perkawinan wajib dipilih' }),
})

type FormValues = z.infer<typeof schema>

// ─── Component ─────────────────────────────────────────────────────────────
export default function ResidentForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const toast = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // File dikelola manual (bukan via register) agar ref tidak konflik
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Fetch existing data when editing
  const { data: existingData, isLoading: isFetching } = useQuery({
    queryKey: ['resident', id],
    queryFn: async () => {
      const result = await residentService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Prefill form when editing
  useEffect(() => {
    if (existingData) {
      reset({
        full_name: existingData.full_name,
        phone_number: existingData.phone_number,
        is_contract: existingData.is_contract ? '1' : '0',
        is_married: existingData.is_married ? '1' : '0',
      })
      setPreviewUrl(existingData.ktp_photo)
    }
  }, [existingData, reset])

  // Handle file selection secara manual agar ref tidak konflik dengan RHF
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFileError(null)

    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFileError('Format harus JPEG atau PNG')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('Ukuran maksimal 2 MB')
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    // Selalu kosongkan preview agar area upload muncul
    // (saat edit tanpa file baru dipilih, foto lama tetap dipertahankan di backend)
    setPreviewUrl(null)
  }

  const onSubmit = async (values: FormValues) => {
    // Validasi foto KTP wajib saat create
    if (!isEdit && !selectedFile) {
      setFileError('Foto KTP wajib diunggah')
      return
    }

    const formData = new FormData()
    formData.append('full_name', values.full_name)
    formData.append('phone_number', values.phone_number)
    formData.append('is_contract', values.is_contract)
    formData.append('is_married', values.is_married)

    if (selectedFile) {
      formData.append('ktp_photo', selectedFile)
    }

    const result = isEdit
      ? await residentService.update(id!, formData)
      : await residentService.create(formData)

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    // Invalidate cache agar data terbaru langsung tampil tanpa refresh manual
    queryClient.invalidateQueries({ queryKey: ['residents'] })
    if (isEdit) queryClient.invalidateQueries({ queryKey: ['resident', id] })

    toast.success(isEdit ? 'Data penghuni berhasil diperbarui.' : 'Penghuni berhasil ditambahkan.')
    navigate(isEdit ? `/residents/${id}` : '/residents')
  }

  if (isEdit && isFetching) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(isEdit ? `/residents/${id}` : '/residents')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Daftar'}
      </button>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-8 py-5 border-b border-border/60 bg-muted/20">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Data Penghuni' : 'Tambah Penghuni Baru'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Perbarui informasi penghuni di bawah ini.' : 'Isi formulir berikut untuk mendaftarkan penghuni baru.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
          {/* Nama & HP */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-medium">Nama Lengkap</Label>
              <Input
                id="full_name"
                placeholder="Masukkan nama lengkap"
                className="h-10"
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone_number" className="text-sm font-medium">No. HP</Label>
              <Input
                id="phone_number"
                placeholder="Contoh: 08123456789"
                className="h-10"
                {...register('phone_number')}
              />
              {errors.phone_number && (
                <p className="text-xs text-destructive">{errors.phone_number.message}</p>
              )}
            </div>
          </div>

          {/* Status selects */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status Hunian</Label>
              <Select
                defaultValue={isEdit ? (existingData?.is_contract ? '1' : '0') : undefined}
                onValueChange={(v) => setValue('is_contract', v as '0' | '1')}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Tetap</SelectItem>
                  <SelectItem value="1">Kontrak</SelectItem>
                </SelectContent>
              </Select>
              {errors.is_contract && (
                <p className="text-xs text-destructive">{errors.is_contract.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status Perkawinan</Label>
              <Select
                defaultValue={isEdit ? (existingData?.is_married ? '1' : '0') : undefined}
                onValueChange={(v) => setValue('is_married', v as '0' | '1')}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Menikah</SelectItem>
                  <SelectItem value="0">Belum Menikah</SelectItem>
                </SelectContent>
              </Select>
              {errors.is_married && (
                <p className="text-xs text-destructive">{errors.is_married.message}</p>
              )}
            </div>
          </div>

          {/* Foto KTP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Foto KTP</Label>
              {isEdit && (
                <span className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengganti foto</span>
              )}
            </div>

            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Preview KTP"
                  className="h-44 w-auto rounded-xl border shadow-sm object-cover"
                />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 h-36 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Klik untuk unggah foto</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEdit ? 'Biarkan kosong untuk mempertahankan foto lama' : 'JPEG atau PNG, maks 2 MB'}
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          {/* Divider */}
          <div className="border-t border-border/60" />

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-10 shadow-sm">
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Penghuni'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/residents/${id}` : '/residents')}
              disabled={isSubmitting}
              className="flex-1 h-10"
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
