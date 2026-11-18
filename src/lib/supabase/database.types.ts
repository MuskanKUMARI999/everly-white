export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          key: string;
          label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          label: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          label?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          category_id: string | null;
          hero_image: string | null;
          is_published: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          category_id?: string | null;
          hero_image?: string | null;
          is_published?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          category_id?: string | null;
          hero_image?: string | null;
          is_published?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          stock_quantity: number;
          is_available: boolean;
          is_bestseller: boolean;
          is_new_arrival: boolean;
          category_id: string | null;
          collection_id: string | null;
          material: string | null;
          dimensions: string | null;
          composition: string | null;
          weight: string | null;
          care_instructions: string | null;
          making_time: string | null;
          shipping_info: string | null;
          tagline: string | null;
          story: string | null;
          sort_order: number;
          hsn_code: string | null;
          gst_rate: number | null;
          metadata: Json;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          is_available?: boolean;
          is_bestseller?: boolean;
          is_new_arrival?: boolean;
          category_id?: string | null;
          collection_id?: string | null;
          material?: string | null;
          dimensions?: string | null;
          composition?: string | null;
          weight?: string | null;
          care_instructions?: string | null;
          making_time?: string | null;
          shipping_info?: string | null;
          tagline?: string | null;
          story?: string | null;
          sort_order?: number;
          hsn_code?: string | null;
          gst_rate?: number | null;
          metadata?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          is_available?: boolean;
          is_bestseller?: boolean;
          is_new_arrival?: boolean;
          category_id?: string | null;
          collection_id?: string | null;
          material?: string | null;
          dimensions?: string | null;
          composition?: string | null;
          weight?: string | null;
          care_instructions?: string | null;
          making_time?: string | null;
          shipping_info?: string | null;
          tagline?: string | null;
          story?: string | null;
          sort_order?: number;
          hsn_code?: string | null;
          gst_rate?: number | null;
          metadata?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          position?: number;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt?: string | null;
          position?: number;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_videos: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_emails: {
        Row: {
          email: string;
          created_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          pin_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          pin_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          pin_code?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          guest_id: string | null;
          coupon_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          coupon_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string | null;
          guest_id: string | null;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          guest_email: string | null;
          former_account_email: string | null;
          status: Database["public"]["Enums"]["order_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_method: string | null;
          payment_id: string | null;
          subtotal: number;
          discount_amount: number;
          shipping_amount: number;
          total: number;
          coupon_code: string | null;
          shipping_address: Json;
          billing_address: Json | null;
          notes: string | null;
          tracking_number: string | null;
          payment_details: Json | null;
          courier: string | null;
          cancelled_at: string | null;
          refund_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          guest_email?: string | null;
          former_account_email?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_method?: string | null;
          payment_id?: string | null;
          subtotal: number;
          discount_amount?: number;
          shipping_amount?: number;
          total: number;
          coupon_code?: string | null;
          shipping_address: Json;
          billing_address?: Json | null;
          notes?: string | null;
          tracking_number?: string | null;
          payment_details?: Json | null;
          courier?: string | null;
          cancelled_at?: string | null;
          refund_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          guest_email?: string | null;
          former_account_email?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_method?: string | null;
          payment_id?: string | null;
          subtotal?: number;
          discount_amount?: number;
          shipping_amount?: number;
          total?: number;
          coupon_code?: string | null;
          shipping_address?: Json;
          billing_address?: Json | null;
          notes?: string | null;
          tracking_number?: string | null;
          payment_details?: Json | null;
          courier?: string | null;
          cancelled_at?: string | null;
          refund_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_image: string | null;
          price: number;
          quantity: number;
          total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_image?: string | null;
          price: number;
          quantity: number;
          total: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_image?: string | null;
          price?: number;
          quantity?: number;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          user_id: string | null;
          reviewer_name: string;
          rating: number;
          title: string | null;
          body: string;
          is_verified_purchase: boolean;
          is_approved: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          reviewer_name: string;
          rating: number;
          title?: string | null;
          body: string;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          reviewer_name?: string;
          rating?: number;
          title?: string | null;
          body?: string;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string;
          cover_image: string | null;
          author: string | null;
          published_at: string | null;
          is_published: boolean;
          metadata: Json;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content: string;
          cover_image?: string | null;
          author?: string | null;
          published_at?: string | null;
          is_published?: boolean;
          metadata?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          author?: string | null;
          published_at?: string | null;
          is_published?: boolean;
          metadata?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          is_resolved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          is_resolved?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          min_order_amount: number | null;
          max_uses: number | null;
          uses_count: number;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type?: "percentage" | "fixed";
          discount_value: number;
          min_order_amount?: number | null;
          max_uses?: number | null;
          uses_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          min_order_amount?: number | null;
          max_uses?: number | null;
          uses_count?: number;
          is_active?: boolean;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          placement: string;
          image_url: string;
          link_url: string | null;
          alt: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          placement?: string;
          image_url: string;
          link_url?: string | null;
          alt?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          placement?: string;
          image_url?: string;
          link_url?: string | null;
          alt?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      // One row per editable page section. `content` is JSONB whose shape is declared in
      // src/lib/content/sections.ts, so it stays `Json` here and is narrowed by normaliseValues().
      site_content: {
        Row: {
          key: string;
          content: Json;
          is_visible: boolean;
          updated_at: string;
        };
        Insert: {
          key: string;
          content?: Json;
          is_visible?: boolean;
          updated_at?: string;
        };
        Update: {
          key?: string;
          content?: Json;
          is_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      faq_categories: {
        Row: {
          id: string;
          title: string;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      faq_items: {
        Row: {
          id: string;
          category_id: string;
          question: string;
          /** Plain text with [label](/path) inline links; rendered by RichText. */
          answer: string;
          position: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          question: string;
          answer?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          question?: string;
          answer?: string;
          position?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faq_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "faq_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      business_settings: {
        Row: {
          id: boolean;
          // Nullable since 038: null means "no override, use the hardcoded
          // seller details". They were NOT NULL DEFAULT in 033, which made the
          // seeded row silently win over the constants.
          legal_name: string | null;
          trade_name: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          pin_code: string | null;
          country: string | null;
          gstin: string | null;
          pan: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          logo_url: string | null;
          signature_url: string | null;
          invoice_prefix: string | null;
          default_gst_rate: number | null;
          default_hsn_code: string | null;
          invoice_terms: string | null;
          bank_details: string | null;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          legal_name?: string;
          trade_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          pin_code?: string | null;
          country?: string;
          gstin?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          invoice_prefix?: string;
          default_gst_rate?: number;
          default_hsn_code?: string | null;
          invoice_terms?: string | null;
          bank_details?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          legal_name?: string;
          trade_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          pin_code?: string | null;
          country?: string;
          gstin?: string | null;
          pan?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          logo_url?: string | null;
          signature_url?: string | null;
          invoice_prefix?: string;
          default_gst_rate?: number;
          default_hsn_code?: string | null;
          invoice_terms?: string | null;
          bank_details?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_counters: {
        Row: {
          financial_year: string;
          last_serial: number;
        };
        Insert: {
          financial_year: string;
          last_serial?: number;
        };
        Update: {
          financial_year?: string;
          last_serial?: number;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          order_id: string;
          invoice_number: string;
          financial_year: string;
          serial: number;
          issued_at: string;
          seller: Json;
          buyer: Json;
          place_of_supply: string;
          place_of_supply_code: string;
          is_interstate: boolean;
          line_items: Json;
          totals: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          invoice_number: string;
          financial_year: string;
          serial: number;
          issued_at?: string;
          seller: Json;
          buyer: Json;
          place_of_supply: string;
          place_of_supply_code: string;
          is_interstate: boolean;
          line_items: Json;
          totals: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          invoice_number?: string;
          financial_year?: string;
          serial?: number;
          issued_at?: string;
          seller?: Json;
          buyer?: Json;
          place_of_supply?: string;
          place_of_supply_code?: string;
          is_interstate?: boolean;
          line_items?: Json;
          totals?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_product_stock: {
        Args: { p_product_id: string; p_quantity: number };
        Returns: number;
      };
      increment_coupon_usage: {
        Args: { p_code: string };
        Returns: number;
      };
      increment_product_stock: {
        Args: { p_product_id: string; p_quantity: number };
        Returns: number;
      };
      decrement_coupon_usage: {
        Args: { p_code: string };
        Returns: number;
      };
      admin_dashboard_stats: {
        Args: Record<string, never>;
        Returns: {
          total_orders: number;
          paid_orders: number;
          pending_orders: number;
          total_revenue: number;
          total_products: number;
          available_products: number;
        }[];
      };
      admin_sales_chart: {
        Args: { p_days?: number };
        Returns: { day: string; revenue: number; orders: number }[];
      };
      // Allocates the next invoice number for the financial year and writes the
      // invoice in one transaction; returns the existing row if the order has
      // already been invoiced. Returns a set, so supabase-js gives back an array.
      issue_invoice: {
        Args: {
          p_order_id: string;
          p_financial_year: string;
          p_prefix: string;
          p_seller: Json;
          p_buyer: Json;
          p_place_of_supply: string;
          p_place_of_supply_code: string;
          p_is_interstate: boolean;
          p_line_items: Json;
          p_totals: Json;
        };
        Returns: Database["public"]["Tables"]["invoices"]["Row"][];
      };
    };
    Enums: {
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
      payment_status: "pending" | "paid" | "failed" | "refunded";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
