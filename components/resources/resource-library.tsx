"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/store/enhanced-context"
import { Search, BookOpen, Video, FileText, ExternalLink, Clock, Star } from "lucide-react"
import type { Resource } from "@/lib/types"

export function ResourceLibrary() {
  const { state } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")

  // Sample resources - in a real app, these would come from the API
  const sampleResources: Resource[] = [
    {
      id: "1",
      title: "Understanding Asthma: A Teen's Guide",
      type: "article",
      description:
        "Comprehensive guide to understanding asthma triggers, symptoms, and management strategies for teenagers.",
      tags: ["asthma", "education", "management"],
      category: "Education",
      difficulty: "beginner",
      estimatedReadTime: 10,
      content: "Detailed article content about asthma management...",
    },
    {
      id: "2",
      title: "Proper Inhaler Technique",
      type: "video",
      description: "Step-by-step video demonstration of correct inhaler usage techniques.",
      url: "https://example.com/inhaler-video",
      tags: ["asthma", "medication", "technique"],
      category: "Treatment",
      difficulty: "beginner",
      estimatedReadTime: 5,
    },
    {
      id: "3",
      title: "Asthma Action Plan Template",
      type: "pdf",
      description: "Downloadable template for creating your personalized asthma action plan.",
      url: "https://example.com/action-plan.pdf",
      tags: ["asthma", "planning", "emergency"],
      category: "Tools",
      difficulty: "intermediate",
    },
    {
      id: "4",
      title: "Managing Diabetes at School",
      type: "article",
      description:
        "Tips and strategies for managing diabetes while at school, including talking to teachers and handling emergencies.",
      tags: ["diabetes", "school", "management"],
      category: "Lifestyle",
      difficulty: "intermediate",
      estimatedReadTime: 15,
    },
    {
      id: "5",
      title: "Stress Management Techniques",
      type: "video",
      description:
        "Learn effective stress management techniques specifically designed for teens with chronic conditions.",
      url: "https://example.com/stress-management",
      tags: ["mental-health", "stress", "coping"],
      category: "Mental Health",
      difficulty: "beginner",
      estimatedReadTime: 12,
    },
  ]

  const resources = state.resources?.length > 0 ? state.resources : sampleResources

  const categories = ["all", ...Array.from(new Set(resources.map((r) => r.category)))]
  const difficulties = ["all", "beginner", "intermediate", "advanced"]

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || resource.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getResourceIcon = (type: Resource["type"]) => {
    switch (type) {
      case "article":
        return <FileText className="w-5 h-5" />
      case "video":
        return <Video className="w-5 h-5" />
      case "pdf":
        return <FileText className="w-5 h-5" />
      case "link":
        return <ExternalLink className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getDifficultyColor = (difficulty: Resource["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700"
      case "intermediate":
        return "bg-yellow-100 text-yellow-700"
      case "advanced":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Library</h2>
        <p className="text-gray-600">
          Explore educational materials, guides, and tools to help manage your health condition.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="wellness-card">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="rounded-full capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <Button
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className="rounded-full capitalize"
                  >
                    {difficulty}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="wellness-card hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {getResourceIcon(resource.type)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {resource.type}
                  </Badge>
                </div>
                <Badge className={getDifficultyColor(resource.difficulty)}>{resource.difficulty}</Badge>
              </div>
              <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-3">{resource.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {resource.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{resource.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{resource.estimatedReadTime || 5} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>4.5</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full wellness-button-primary"
                onClick={() => {
                  if (resource.url) {
                    window.open(resource.url, "_blank")
                  } else {
                    // Open resource viewer modal
                    console.log("Open resource:", resource.id)
                  }
                }}
              >
                {resource.type === "video" ? "Watch" : "Read"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredResources.length === 0 && (
        <Card className="wellness-card">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters to find relevant resources.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
