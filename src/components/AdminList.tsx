import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type Tamu } from "../lib/supabase";
import {
  LogOut,
  UserPlus,
  QrCode,
  Users,
  Search,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle,
  Download,
} from "lucide-react";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import AddGuestModal from "./AddGuestModal";
import QRCodeModal from "./QRCodeModal";

export default function AdminList() {
  const [tamu, setTamu] = useState<Tamu[]>([]);
  const [filteredTamu, setFilteredTamu] = useState<Tamu[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const limit = 10;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const getTimeAgo = useCallback((date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;
    return "Baru saja";
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchTamu = useCallback(
    async (pageNum: number, search: string = "", reset: boolean = false) => {
      if (loading && !reset) return;
      setLoading(true);

      const from = pageNum * limit;
      const to = from + limit - 1;

      let query = supabase.from("tamu").select("*", { count: "exact" });

      if (search.trim()) {
        query = query.ilike("nama", `%${search.trim()}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      setLoading(false);
      setIsInitialLoad(false);

      if (error) {
        console.error("Error fetching tamu:", error);
        return;
      }

      if (count !== null) {
        setTotalCount(count);
      }

      if (data) {
        if (reset || pageNum === 0) {
          setTamu(data);
          setFilteredTamu(data);
        } else {
          setTamu((prev) => [...prev, ...data]);
          setFilteredTamu((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === limit);
      } else {
        setHasMore(false);
      }
    },
    [loading, limit]
  );

  // Search handler dengan debounce
  useEffect(() => {
    const searchTamu = async () => {
      if (!searchQuery.trim()) {
        setPage(0);
        setHasMore(true);
        setIsInitialLoad(true);
        await fetchTamu(0, "", true);
        return;
      }

      setLoading(true);
      const from = 0;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("tamu")
        .select("*", { count: "exact" })
        .ilike("nama", `%${searchQuery.trim()}%`)
        .order("created_at", { ascending: false })
        .range(from, to);

      setLoading(false);

      if (error) {
        console.error("Error searching tamu:", error);
        return;
      }

      if (count !== null) {
        setTotalCount(count);
      }

      if (data) {
        setFilteredTamu(data);
        setHasMore(false);
        setPage(0);
      }
    };

    const debounce = setTimeout(searchTamu, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, limit, fetchTamu]);

  useEffect(() => {
    const loadData = async () => {
      const isAdmin = localStorage.getItem("isAdmin");
      if (!isAdmin) {
        navigate("/");
        return;
      }
      await fetchTamu(0);
    };
    loadData();
  }, [fetchTamu, navigate]);

  // Intersection Observer untuk infinite scroll manual
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && !searchQuery.trim()) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchTamu(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loading, hasMore, page, searchQuery, fetchTamu]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  const handleTambahTamu = (newTamu: Tamu) => {
    setTamu((prev) => [newTamu, ...prev]);
    setFilteredTamu((prev) => [newTamu, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("tamu").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tamu:", error);
      setDeletingId(null);
      return;
    }

    setTamu((prev) => prev.filter((item) => item.id !== id));
    setFilteredTamu((prev) => prev.filter((item) => item.id !== id));
    setTotalCount((prev) => prev - 1);
    setDeletingId(null);
    setShowDeleteConfirm(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPage(0);
    setHasMore(true);
    setIsInitialLoad(true);
    fetchTamu(0, "", true);
  };

  // Export Excel dengan styling
  const handleExportExcel = async () => {
    setExporting(true);
    
    try {
      // Ambil semua data
      const { data, error } = await supabase
        .from("tamu")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all data:", error);
        setExporting(false);
        return;
      }

      if (!data || data.length === 0) {
        alert("Tidak ada data untuk diexport");
        setExporting(false);
        return;
      }

      // Buat workbook dan worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daftar Tamu', {
        views: [{ state: 'frozen', ySplit: 1 }]
      });

      // ===== STYLING =====
      // Warna primary dari tema (#3525cd)
      const primaryColor = 'FF3525CD';
      const primaryLight = 'FF4F46E5';
      const surfaceColor = 'FFF8F9FA';
      const borderColor = 'FFE1E3E4';
      const textColor = 'FF191C1D';
      const textLightColor = 'FF777587';

      // Column widths
      worksheet.columns = [
        { header: 'No', key: 'no', width: 8 },
        { header: 'Nama Lengkap', key: 'nama', width: 30 },
        { header: 'Asal Instansi/Organisasi', key: 'instansi', width: 35 },
        { header: 'Tanggal Kunjungan', key: 'tanggal', width: 25 },
      ];

      // ===== HEADER STYLING =====
      const headerRow = worksheet.getRow(1);
      
      // Set tinggi header
      headerRow.height = 30;
      
      // Style setiap cell di header
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: primaryColor }
        };
        cell.font = {
          name: 'Calibri',
          size: 12,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: primaryLight } },
          left: { style: 'thin', color: { argb: primaryLight } },
          bottom: { style: 'medium', color: { argb: primaryColor } },
          right: { style: 'thin', color: { argb: primaryLight } }
        };
      });

      // ===== DATA STYLING =====
      // Isi data
      data.forEach((item, index) => {
        const row = worksheet.addRow({
          no: index + 1,
          nama: item.nama,
          instansi: item.instansi,
          tanggal: formatDate(item.created_at)
        });

        // Set tinggi row
        row.height = 24;

        // Style setiap cell di row
        row.eachCell((cell, colNumber) => {
          // Warna background bergantian (zebra)
          const isEven = index % 2 === 0;
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : surfaceColor }
          };
          
          cell.font = {
            name: 'Calibri',
            size: 11,
            color: { argb: textColor }
          };
          
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 ? 'center' : 'left',
            wrapText: true
          };
          
          cell.border = {
            top: { style: 'thin', color: { argb: borderColor } },
            left: { style: 'thin', color: { argb: borderColor } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } }
          };
        });

        // Style khusus untuk kolom No (center alignment)
        const noCell = row.getCell(1);
        noCell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        noCell.font = {
          name: 'Calibri',
          size: 11,
          color: { argb: textLightColor }
        };
      });

      // ===== FOOTER =====
      // Tambah baris kosong
      const emptyRow = worksheet.addRow([]);
      emptyRow.height = 10;

      // Footer dengan total
      const footerRow = worksheet.addRow({
        no: '',
        nama: '',
        instansi: `Total Tamu: ${data.length}`,
        tanggal: `Dicetak: ${new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`
      });

      footerRow.height = 28;
      footerRow.eachCell((cell) => {
        cell.font = {
          name: 'Calibri',
          size: 10,
          italic: true,
          color: { argb: textLightColor }
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left'
        };
        cell.border = {
          top: { style: 'medium', color: { argb: borderColor } }
        };
      });

      // Merge cell untuk footer
      worksheet.mergeCells(`C${footerRow.number}:D${footerRow.number}`);

      // ===== GENERATE FILE =====
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `Daftar_Tamu_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;
      saveAs(blob, fileName);
      
      setExporting(false);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      setExporting(false);
      alert("Gagal mengexport data");
    }
  };

  const displayData = searchQuery.trim() ? filteredTamu : tamu;

  // Skeleton untuk initial load
  if (isInitialLoad && displayData.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-variant">
          <div className="max-w-container-max mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-headline-md text-primary font-bold">Daftar Tamu</h1>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-9 h-9 bg-surface-container-low rounded-lg animate-pulse" />
              <div className="w-9 h-9 bg-surface-container-low rounded-lg animate-pulse" />
              <div className="w-9 h-9 bg-surface-container-low rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
        <main className="pt-20 pb-6 px-4 max-w-container-max mx-auto">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-lg border border-outline-variant/60 p-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-low rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container-low rounded w-1/3" />
                    <div className="h-3 bg-surface-container-low rounded w-1/2" />
                  </div>
                  <div className="w-20 h-3 bg-surface-container-low rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-variant">
        <div className="max-w-container-max mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-headline-md text-primary font-bold truncate">
              Daftar Tamu
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Tampilkan QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-14 pb-6 px-4 max-w-container-max mx-auto mt-5">
        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="bg-surface-container-low px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-label-sm text-on-surface-variant">
                Total{" "}
                <span className="font-semibold text-on-surface">
                  {totalCount}
                </span>
              </span>
            </div>
            <div className="hidden xs:block w-px h-6 bg-outline-variant/40" />
            <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant/60 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Live</span>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              disabled={exporting || totalCount === 0}
              className="flex-1 sm:flex-none bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg font-label-sm font-medium transition-all flex items-center justify-center gap-2 border active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />Export
                  {/* <span className="hidden xs:inline">Export</span> */}
                </>
              )}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none bg-primary text-on-primary px-4 py-2 rounded-lg font-label-sm font-medium hover:bg-primary/90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 touch-manipulation cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden xs:inline">Tambah Tamu</span>
              <span className="xs:hidden">Tambah</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tamu berdasarkan nama..."
              className="w-full pl-9 pr-10 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md placeholder:text-outline-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-label-xs text-on-surface-variant/60 mt-1.5">
              Menampilkan {displayData.length} dari {totalCount} tamu
            </p>
          )}
        </div>

        {/* Table */}
        <div
          id="scrollableDiv"
          className="h-[calc(100dvh-280px)] overflow-y-auto scroll-smooth -mx-1 px-1"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/60 overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-surface-container-low border-b border-outline-variant/40 text-label-xs font-medium text-on-surface-variant/60 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Nama</div>
              <div className="col-span-4">Instansi</div>
              <div className="col-span-2">Waktu</div>
              <div className="col-span-1 text-right">Aksi</div>
            </div>

            {/* Table Body */}
            {displayData.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 px-4 py-3 border-b border-outline-variant/30 last:border-b-0 hover:bg-surface-container-low/50 transition-colors"
              >
                {/* Nomor */}
                <div className="hidden sm:flex sm:col-span-1 items-center text-label-sm text-on-surface-variant/60">
                  {index + 1}
                </div>

                {/* Nama */}
                <div className="sm:col-span-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 sm:hidden">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-body-md font-medium text-on-surface truncate">
                      {item.nama}
                    </span>
                  </div>
                </div>

                {/* Instansi */}
                <div className="sm:col-span-4">
                  <p className="text-body-md text-on-surface-variant truncate">
                    {item.instansi}
                  </p>
                </div>

                {/* Waktu */}
                <div className="sm:col-span-2">
                  <span className="text-label-xs text-on-surface-variant/60 whitespace-nowrap">
                    {getTimeAgo(item.created_at)}
                  </span>
                </div>

                {/* Aksi */}
                <div className="sm:col-span-1 flex items-center justify-end sm:justify-end gap-2">
                  {showDeleteConfirm === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 bg-error text-on-error rounded-lg hover:bg-error/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Konfirmasi hapus"
                      >
                        {deletingId === item.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="p-1.5 bg-surface-container-low text-on-surface-variant rounded-lg hover:bg-surface-container transition-all active:scale-95 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(item.id)}
                      className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error/10 rounded-lg transition-all active:scale-95 cursor-pointer"
                      title="Hapus tamu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* End Message / Load More Trigger */}
            {displayData.length > 0 && (
              <div ref={loadMoreRef} className="py-4 text-center">
                {hasMore && !searchQuery.trim() ? (
                  <div className="flex items-center justify-center gap-2 text-label-sm text-on-surface-variant/60">
                    <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Memuat lebih banyak...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-label-sm text-on-surface-variant/40">
                    <div className="w-8 h-px bg-outline-variant/20" />
                    <span>Semua data dimuat</span>
                    <div className="w-8 h-px bg-outline-variant/20" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Empty State */}
          {displayData.length === 0 && !isInitialLoad && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-outline-variant" />
              </div>
              <p className="text-body-md text-on-surface-variant">
                {searchQuery ? "Tamu tidak ditemukan" : "Belum ada tamu"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-label-sm text-primary font-medium hover:underline cursor-pointer"
                >
                  Tambah tamu pertama
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddGuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleTambahTamu}
      />

      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}