import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, RefreshCw, Clock, DollarSign, User, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminWithdrawalsPage = ({ onNavigate }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPendingWithdrawals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/withdrawals/admin/pending`);
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
      setPendingCount(data.pending_count || 0);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل طلبات السحب',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingWithdrawals();
  }, []);

  const handleApprove = async (withdrawalId) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/withdrawals/admin/${withdrawalId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: 'تمت الموافقة',
          description: 'تم الموافقة على طلب السحب بنجاح'
        });
        loadPendingWithdrawals();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في الموافقة على الطلب',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/api/withdrawals/admin/${selectedWithdrawal.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      if (response.ok) {
        toast({
          title: 'تم الرفض',
          description: 'تم رفض طلب السحب وإعادة النقاط للمستخدم'
        });
        setShowRejectDialog(false);
        setSelectedWithdrawal(null);
        setRejectReason('');
        loadPendingWithdrawals();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في رفض الطلب',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
      
      <div className="relative px-4 pt-8 pb-6">
        <button
          onClick={() => onNavigate('admin')}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          data-testid="back-btn"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">طلبات السحب</h1>
            <p className="text-gray-400 mt-1">إدارة طلبات السحب المعلقة</p>
          </div>
          <Button
            onClick={loadPendingWithdrawals}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white"
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Stats Card */}
        <Card className="shadow-xl border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-xl rounded-2xl">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                <p className="text-gray-400 text-sm">طلب معلق</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Note */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">
            طلبات السحب التي تساوي أو تزيد عن 10 نقاط تحتاج موافقة يدوية.
            الطلبات الأقل من 10 نقاط تُوافق تلقائياً.
          </p>
        </div>

        {/* Withdrawals List */}
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-2">لا توجد طلبات معلقة</h3>
              <p className="text-gray-400 text-sm">جميع طلبات السحب تمت معالجتها</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <Card 
                key={withdrawal.id} 
                className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl"
              >
                <CardContent className="pt-4">
                  {/* User Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{withdrawal.user?.name || 'مستخدم'}</p>
                        <p className="text-gray-500 text-xs">{withdrawal.user?.email || '-'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                      بانتظار الموافقة
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-gray-400">المبلغ</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">${withdrawal.amount}</p>
                        <p className="text-gray-500 text-xs">{withdrawal.points} نقطة</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-gray-400 text-xs mb-1">طريقة السحب</p>
                      <p className="text-white">{withdrawal.method_name}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-gray-400 text-xs mb-1">التاريخ</p>
                      <p className="text-white text-xs">{formatDate(withdrawal.created_at)}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {withdrawal.details && (
                    <div className="bg-white/5 rounded-lg p-2 mb-4 text-xs">
                      <p className="text-gray-400 mb-1">تفاصيل الدفع:</p>
                      {withdrawal.details.email && <p className="text-white">البريد: {withdrawal.details.email}</p>}
                      {withdrawal.details.phone && <p className="text-white">الجوال: {withdrawal.details.phone}</p>}
                      {withdrawal.details.iban && <p className="text-white">IBAN: {withdrawal.details.iban}</p>}
                      {withdrawal.details.bank_name && <p className="text-white">البنك: {withdrawal.details.bank_name}</p>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(withdrawal.id)}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid={`approve-${withdrawal.id}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      موافقة
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setShowRejectDialog(true);
                      }}
                      disabled={isProcessing}
                      variant="outline"
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                      data-testid={`reject-${withdrawal.id}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="text-red-400" size={20} />
              رفض طلب السحب
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              سيتم رفض الطلب وإعادة {selectedWithdrawal?.points} نقطة للمستخدم.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-300">سبب الرفض (اختياري)</Label>
              <Input
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="أدخل سبب الرفض..."
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'جاري الرفض...' : 'رفض الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalsPage;
