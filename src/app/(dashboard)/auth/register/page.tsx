"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Mail, Phone, MapPin, Building, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    delete: false,
    admin: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Registration submitted");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Registration"
        description="Create new admin user accounts with appropriate roles and permissions."
      />

      <div className="max-w-4xl">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="account">Account Details</TabsTrigger>
            <TabsTrigger value="permissions">Role & Permissions</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Enter the basic personal details for the new user.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="john.doe@example.com" className="pl-10" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" className="pl-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Select>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="it">IT</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="location" placeholder="New York, NY" className="pl-10" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Security
                  </CardTitle>
                  <CardDescription>
                    Set up the login credentials and security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="johndoe" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter secure password"
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Security Questions</Label>
                    <div className="space-y-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security question 1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pet">What was your first pet's name?</SelectItem>
                          <SelectItem value="school">What elementary school did you attend?</SelectItem>
                          <SelectItem value="city">In what city were you born?</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Answer to security question 1" />
                    </div>
                    <div className="space-y-2">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select security question 2" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mother">What is your mother's maiden name?</SelectItem>
                          <SelectItem value="friend">What is your best friend's name?</SelectItem>
                          <SelectItem value="car">What was your first car?</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Answer to security question 2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Assignment</CardTitle>
                  <CardDescription>
                    Assign a role and configure specific permissions for this user.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">User Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedRole && (
                      <div className="mt-2">
                        <Badge variant="secondary">
                          {selectedRole === "admin" && "Full system access"}
                          {selectedRole === "manager" && "Department management"}
                          {selectedRole === "supervisor" && "Team oversight"}
                          {selectedRole === "operator" && "Daily operations"}
                          {selectedRole === "viewer" && "Read-only access"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Specific Permissions</CardTitle>
                  <CardDescription>
                    Configure granular permissions based on the user's responsibilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">General Permissions</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="read"
                            checked={permissions.read}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, read: checked as boolean })
                            }
                          />
                          <Label htmlFor="read" className="text-sm">
                            Read Access
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="write"
                            checked={permissions.write}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, write: checked as boolean })
                            }
                          />
                          <Label htmlFor="write" className="text-sm">
                            Write Access
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="delete"
                            checked={permissions.delete}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, delete: checked as boolean })
                            }
                          />
                          <Label htmlFor="delete" className="text-sm">
                            Delete Access
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="admin"
                            checked={permissions.admin}
                            onCheckedChange={(checked) =>
                              setPermissions({ ...permissions, admin: checked as boolean })
                            }
                          />
                          <Label htmlFor="admin" className="text-sm">
                            Administrative Access
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Module Access</h4>
                      <div className="space-y-3">
                        {[
                          "Products Management",
                          "Order Processing",
                          "Customer Management",
                          "Analytics & Reports",
                          "Content Management",
                          "System Settings",
                        ].map((module) => (
                          <div key={module} className="flex items-center space-x-2">
                            <Checkbox id={module} />
                            <Label htmlFor={module} className="text-sm">
                              {module}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </form>

          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline">Cancel</Button>
            <Button type="submit" onClick={handleSubmit}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User Account
            </Button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic'
