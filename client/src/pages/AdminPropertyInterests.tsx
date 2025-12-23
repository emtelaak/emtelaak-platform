import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Search, Download, Mail, Phone, Calendar, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function AdminPropertyInterests() {
  const { language } = useLanguage();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: interests, isLoading } = trpc.propertyInterests.getAllInterests.useQuery();
  const { data: properties } = trpc.properties.getAll.useQuery();

  // Get unique properties from interests
  const uniqueProperties = interests
    ? [...new Map(interests.map(i => [i.propertyId, { id: i.propertyId, name: i.propertyName }])).values()]
    : [];

  // Filter interests
  const filteredInterests = interests?.filter(interest => {
    const matchesProperty = propertyFilter === "all" || interest.propertyId.toString() === propertyFilter;
    const matchesSearch = searchQuery === "" || 
      interest.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interest.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interest.userPhone?.includes(searchQuery);
    return matchesProperty && matchesSearch;
  });

  // Group interests by property for summary
  const interestsByProperty = interests?.reduce((acc, interest) => {
    if (!acc[interest.propertyId]) {
      acc[interest.propertyId] = {
        propertyName: interest.propertyName,
        count: 0,
      };
    }
    acc[interest.propertyId].count++;
    return acc;
  }, {} as Record<number, { propertyName: string; count: number }>);

  const exportToCSV = () => {
    if (!filteredInterests) return;
    
    const headers = ["Property", "Investor Name", "Email", "Phone", "Date Registered"];
    const rows = filteredInterests.map(i => [
      i.propertyName,
      i.userName || "N/A",
      i.userEmail || "N/A",
      i.userPhone || "N/A",
      new Date(i.createdAt).toLocaleDateString(),
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-interests-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {language === "en" ? "Property Interests" : "اهتمامات العقارات"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" 
                ? "View investors interested in coming soon properties" 
                : "عرض المستثمرين المهتمين بالعقارات القادمة"}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {language === "en" ? "Export CSV" : "تصدير CSV"}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Total Interests" : "إجمالي الاهتمامات"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interests?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Properties with Interest" : "العقارات ذات الاهتمام"}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueProperties.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "en" ? "Today's Interests" : "اهتمامات اليوم"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interests?.filter(i => 
                  new Date(i.createdAt).toDateString() === new Date().toDateString()
                ).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Interest Summary */}
        {interestsByProperty && Object.keys(interestsByProperty).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Interest by Property" : "الاهتمام حسب العقار"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(interestsByProperty).map(([propertyId, data]) => (
                  <Badge key={propertyId} variant="secondary" className="text-sm py-1 px-3">
                    {data.propertyName}: <span className="font-bold ml-1">{data.count}</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "en" ? "Interested Investors" : "المستثمرون المهتمون"}</CardTitle>
            <CardDescription>
              {language === "en" 
                ? "List of all investors who registered interest in coming soon properties" 
                : "قائمة بجميع المستثمرين الذين سجلوا اهتمامهم بالعقارات القادمة"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "en" ? "Search by name, email, or phone..." : "البحث بالاسم أو البريد أو الهاتف..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={language === "en" ? "Filter by property" : "تصفية حسب العقار"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "en" ? "All Properties" : "جميع العقارات"}</SelectItem>
                  {uniqueProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredInterests && filteredInterests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "en" ? "Property" : "العقار"}</TableHead>
                    <TableHead>{language === "en" ? "Investor" : "المستثمر"}</TableHead>
                    <TableHead>{language === "en" ? "Contact" : "التواصل"}</TableHead>
                    <TableHead>{language === "en" ? "Date" : "التاريخ"}</TableHead>
                    <TableHead>{language === "en" ? "Actions" : "الإجراءات"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterests.map((interest) => (
                    <TableRow key={interest.id}>
                      <TableCell>
                        <Link href={`/properties/${interest.propertyId}`}>
                          <span className="font-medium text-primary hover:underline cursor-pointer">
                            {interest.propertyName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{interest.userName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{interest.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {interest.userEmail && (
                            <a href={`mailto:${interest.userEmail}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                              <Mail className="h-3 w-3" />
                              {interest.userEmail}
                            </a>
                          )}
                          {interest.userPhone && (
                            <a href={`tel:${interest.userPhone}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                              <Phone className="h-3 w-3" />
                              {interest.userPhone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(interest.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users?search=${interest.userEmail}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "en" ? "No interests registered yet" : "لم يتم تسجيل أي اهتمامات بعد"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
