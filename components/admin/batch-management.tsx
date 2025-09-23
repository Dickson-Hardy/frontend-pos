"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2 } from "lucide-react"
import { apiClient, Batch } from "@/lib/api-unified"
import { useAuth } from "@/contexts/auth-context"

export function BatchManagement() {
  const { user } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form, setForm] = useState({
    batchNumber: "",
    productId: "",
    outletId: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    supplierName: "",
    supplierInvoice: "",
    notes: "",
  })

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.inventory.getBatches(user?.outletId)
      setBatches(data)
    } catch (e) {
      setError("Failed to load batches")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.outletId])

  const openCreate = () => {
    setEditing(null)
    setForm({
      batchNumber: "",
      productId: "",
      outletId: user?.outletId || "",
      manufacturingDate: "",
      expiryDate: "",
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      supplierName: "",
      supplierInvoice: "",
      notes: "",
    })
    setIsDialogOpen(true)
  }

  const openEdit = (batch: Batch) => {
    setEditing(batch)
    setForm({
      batchNumber: batch.batchNumber,
      productId: batch.productId,
      outletId: batch.outletId,
      manufacturingDate: new Date(batch.manufacturingDate).toISOString().slice(0, 10),
      expiryDate: new Date(batch.expiryDate).toISOString().slice(0, 10),
      quantity: batch.quantity,
      costPrice: batch.costPrice,
      sellingPrice: batch.sellingPrice,
      supplierName: batch.supplierName || "",
      supplierInvoice: batch.supplierInvoice || "",
      notes: batch.notes || "",
    })
    setIsDialogOpen(true)
  }

  const save = async () => {
    try {
      setError(null)
      if (editing) {
        await apiClient.inventory.updateBatch(editing.id, {
          batchNumber: form.batchNumber,
          manufacturingDate: form.manufacturingDate,
          expiryDate: form.expiryDate,
          quantity: form.quantity,
          costPrice: form.costPrice,
          sellingPrice: form.sellingPrice,
          supplierName: form.supplierName,
          supplierInvoice: form.supplierInvoice,
          notes: form.notes,
        })
      } else {
        await apiClient.inventory.createBatch({
          ...form,
          outletId: form.outletId || user?.outletId || '',
        })
      }
      setIsDialogOpen(false)
      await load()
    } catch (e) {
      setError("Failed to save batch")
    }
  }

  const remove = async (batch: Batch) => {
    try {
      await apiClient.inventory.deleteBatch(batch.id)
      await load()
    } catch (e) {
      setError("Failed to delete batch")
    }
  }

  const filtered = batches.filter(b =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.supplierName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search batches..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <div className="flex-1" />
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> New Batch</Button>
      </div>

      {error && (
        <Card><CardContent className="p-3 text-destructive text-sm">{error}</CardContent></Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Price</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(loading ? [] : filtered).map(b => {
            const remaining = b.quantity - b.soldQuantity
            return (
              <TableRow key={b.id}>
                <TableCell>{b.product.name}</TableCell>
                <TableCell className="font-mono">{b.batchNumber}</TableCell>
                <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell>{b.quantity}</TableCell>
                <TableCell>{remaining}</TableCell>
                <TableCell>{b.costPrice}</TableCell>
                <TableCell>{b.sellingPrice}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(b)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Batch' : 'Create Batch'}</DialogTitle>
            <DialogDescription>Manage batch details and quantities.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Batch Number</Label>
              <Input value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} />
            </div>
            <div>
              <Label>Product ID</Label>
              <Input value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} />
            </div>
            <div>
              <Label>Manufacturing Date</Label>
              <Input type="date" value={form.manufacturingDate} onChange={e => setForm({ ...form, manufacturingDate: e.target.value })} />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Cost Price</Label>
              <Input type="number" min="1" max="1500" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Selling Price</Label>
              <Input type="number" min="1" max="1500" step="0.01" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Supplier Name</Label>
              <Input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} />
            </div>
            <div>
              <Label>Supplier Invoice</Label>
              <Input value={form.supplierInvoice} onChange={e => setForm({ ...form, supplierInvoice: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


