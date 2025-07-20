import { useTRPC } from "@/trpc/client";
import { AgentGetOne } from "../../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDescription } from "@/components/ui/form";

import { getAvailableProviders, getModelsForProvider } from "@/lib/ai-service";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedProvider, setSelectedProvider] = useState(initialValues?.aiProvider || "openrouter");
  const availableProviders = getAvailableProviders();
  const availableModels = getModelsForProvider(selectedProvider);

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
            trpc.agents.getMany.queryOptions({}),
        );
        // TODO: Invalidate free tier usage
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message)

        // TODO: Check if error code is "FORBIDDEN" and redirect to "/upgrade"
      },
    })
  );

  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
            trpc.agents.getMany.queryOptions({}),
        );
        if (initialValues?.id) {
            await queryClient.invalidateQueries(
                trpc.agents.getOne.queryOptions({ id: initialValues.id }),
            );
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message)

        // TODO: Check if error code is "FORBIDDEN" and redirect to "/upgrade"
      },
    })
  );

  const form = useForm<z.output<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
      aiProvider: initialValues?.aiProvider ?? "openrouter",
      aiModel: initialValues?.aiModel ?? "mistralai/mistral-7b-instruct",
      temperature: Number(initialValues?.temperature ?? 0.7),
      maxTokens: Number(initialValues?.maxTokens ?? 1000),
    },
  });  

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      updateAgent.mutate({ id: initialValues.id, ...values });
    } else {
      createAgent.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          seed={form.watch("name")}
          variant="botttsNeutral"
          className="border size-16"
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Math Tutor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="instructions"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. You are a helpful math tutor. Answer questions and explain concepts clearly."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="aiProvider"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Provider</FormLabel>
                <FormControl>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedProvider(value);
                    // Reset model to default for new provider
                    form.setValue("aiModel", getModelsForProvider(value)[0] || "");
                  }} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.name.toLowerCase()} value={provider.name.toLowerCase()}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="aiModel"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI Model</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model.split('/').pop() || model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="temperature"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="2" 
                    placeholder="0.7" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Controls randomness (0 = focused, 2 = creative)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="maxTokens"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="4000" 
                    placeholder="1000" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Maximum response length
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update Agent" : "Create Agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
