"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Settings, 
  Printer,
  Receipt,
  Download,
  Upload,
  Bluetooth,
  Usb,
  Wifi,
  CheckCircle,
  Circle,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReceiptTemplate {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  isDefault: boolean
  version: number
  createdAt: string
  updatedAt: string
  outletId: string
  elements: ReceiptElement[]
  paperConfig: PaperConfiguration
  printerConfig: PrinterConfiguration
}

interface ReceiptElement {
  type: string
  content: string
  alignment: 'left' | 'center' | 'right'
  fontSize: 'small' | 'medium' | 'large'
  fontStyle: 'normal' | 'bold' | 'underline' | 'italic'
  bold: boolean
  underline: boolean
  height: number
  marginTop: number
  marginBottom: number
  properties: Record<string, any>
}

interface PaperConfiguration {
  width: number
  unit: string
  physicalWidth: number
  physicalHeight: number
}

interface PrinterConfiguration {
  type: string
  model: string
  connectionType: 'bluetooth' | 'usb' | 'ethernet' | 'wifi'
  commandSet: string
  settings: Record<string, any>
}

export function ReceiptTemplateManagement() {
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all')
  const { toast } = useToast()

  // TODO: Replace with actual API call to fetch receipt templates
  useEffect(() => {
    // const loadTemplates = async () => {
    //   try {
    //     const templatesData = await fetchReceiptTemplates()
    //     setTemplates(templatesData)
    //   } catch (error) {
    //     console.error('Failed to load receipt templates:', error)
    //     toast({
    //       title: "Error",
    //       description: "Failed to load receipt templates",
    //       variant: "destructive"
    //     })
    //   }
    // }
    // loadTemplates()
    
    // For now, initialize with empty templates
    setTemplates([])
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setDialogMode('create')
    setIsDialogOpen(true)
  }

  const handleEditTemplate = (template: ReceiptTemplate) => {
    setSelectedTemplate(template)
    setDialogMode('edit')
    setIsDialogOpen(true)
  }

  const handleViewTemplate = (template: ReceiptTemplate) => {
    setSelectedTemplate(template)
    setDialogMode('view')
    setIsDialogOpen(true)
  }

  const handleDuplicateTemplate = async (template: ReceiptTemplate) => {
    try {
      // API call to duplicate template
      toast({
        title: "Template Duplicated",
        description: `Created a copy of "${template.name}"`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // API call to delete template
      setTemplates(templates.filter(t => t.id !== templateId))
      toast({
        title: "Template Deleted",
        description: "Template has been successfully removed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (templateId: string) => {
    try {
      // API call to set as default
      setTemplates(templates.map(t => ({
        ...t,
        isDefault: t.id === templateId
      })))
      toast({
        title: "Default Template Set",
        description: "Template is now the default for new receipts",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default template",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      draft: "outline"
    } as const

    const colors = {
      active: "text-green-700 bg-green-100",
      inactive: "text-gray-700 bg-gray-100", 
      draft: "text-orange-700 bg-orange-100"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'bluetooth': return <Bluetooth className="h-4 w-4 text-blue-600" />
      case 'usb': return <Usb className="h-4 w-4 text-green-600" />
      case 'wifi': return <Wifi className="h-4 w-4 text-purple-600" />
      default: return <Printer className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Receipt Templates</h2>
          <p className="text-muted-foreground">
            Design and manage receipt templates for thermal printers
          </p>
        </div>
        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <CheckCircle className="h-4 w-4 text-green-600" title="Default Template" />
                    )}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                {getStatusBadge(template.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Version:</span> {template.version}
                </div>
                <div>
                  <span className="text-muted-foreground">Paper:</span> {template.paperConfig.width} chars
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Connection:</span>
                  {getConnectionIcon(template.printerConfig.connectionType)}
                  <span className="capitalize">{template.printerConfig.connectionType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span> {template.printerConfig.model.split(' ')[1]}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTemplate(template)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2 pt-2">
                {!template.isDefault && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetDefault(template.id)}
                    className="flex-1"
                  >
                    Set as Default
                  </Button>
                )}
                {!template.isDefault && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Create your first receipt template to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Dialog */}
      <TemplateDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        template={selectedTemplate}
        onSave={(template) => {
          // Handle save logic here
          setIsDialogOpen(false)
          toast({
            title: dialogMode === 'create' ? "Template Created" : "Template Updated",
            description: `Receipt template has been ${dialogMode === 'create' ? 'created' : 'updated'} successfully`,
          })
        }}
      />
    </div>
  )
}

// Template Dialog Component (will be expanded in next step)
function TemplateDialog({ 
  isOpen, 
  onOpenChange, 
  mode, 
  template, 
  onSave 
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit' | 'view'
  template: ReceiptTemplate | null
  onSave: (template: ReceiptTemplate) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Create Receipt Template'}
            {mode === 'edit' && 'Edit Receipt Template'}
            {mode === 'view' && 'View Receipt Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Design a new receipt template for your thermal printer'}
            {mode === 'edit' && 'Modify the receipt template design and settings'}
            {mode === 'view' && 'View receipt template details and preview'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Template Designer will be implemented in the next step */}
        <div className="py-8 text-center text-muted-foreground">
          Template Designer Component (Coming Next)
        </div>
      </DialogContent>
    </Dialog>
  )
}