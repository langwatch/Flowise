import { useCallback, useEffect, useState } from 'react'

import { Box, Button, Chip, IconButton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconPlus, IconTrash } from '@tabler/icons-react'

import type { InputParam, NodeData } from '@/core/types'

import { NodeInputHandler } from './NodeInputHandler'

export interface ArrayInputProps {
    inputParam: InputParam
    data: NodeData
    disabled?: boolean
    onDataChange?: (params: { inputParam: InputParam; newValue: unknown }) => void
    minItems?: number
}

/**
 * ArrayInput component for rendering array-type inputs with compound items.
 */
export function ArrayInput({ inputParam, data, disabled = false, onDataChange, minItems }: ArrayInputProps) {
    const theme = useTheme()

    // State management: array values and parameter definitions
    const [arrayItems, setArrayItems] = useState<Record<string, unknown>[]>([])
    const [itemParameters, setItemParameters] = useState<InputParam[][]>([])

    // Initialize from data.inputValues
    useEffect(() => {
        const initialArray = data.inputValues?.[inputParam.name]
        const parsedArray = Array.isArray(initialArray) ? initialArray : []
        setArrayItems(parsedArray)

        // Initialize parameter definitions for each item
        // For now, simple replication of inputParam.array (no show/hide logic)
        const initialParams = parsedArray.map(() => inputParam.array?.map((field) => ({ ...field, display: true })) || [])
        setItemParameters(initialParams)
    }, [data.inputValues, inputParam.name, inputParam.array])

    // Handle changes to individual fields within array items
    const handleItemInputChange = useCallback(
        (itemIndex: number, changedParam: InputParam, newValue: unknown) => {
            const updatedArrayItems = [...arrayItems]
            const updatedItem = { ...updatedArrayItems[itemIndex] }

            // Update the specific field
            updatedItem[changedParam.name] = newValue
            updatedArrayItems[itemIndex] = updatedItem

            setArrayItems(updatedArrayItems)

            // Propagate change to parent
            onDataChange?.({ inputParam, newValue: updatedArrayItems })
        },
        [arrayItems, inputParam, onDataChange]
    )

    // Add new array item
    const handleAddItem = useCallback(() => {
        // Initialize new item with default values
        const newItem: Record<string, unknown> = {}

        if (inputParam.array) {
            for (const field of inputParam.array) {
                newItem[field.name] = field.default ?? ''
            }
        }

        const updatedArrayItems = [...arrayItems, newItem]
        setArrayItems(updatedArrayItems)

        // Add parameter definitions for new item
        const newItemParams = inputParam.array?.map((field) => ({ ...field, display: true })) || []
        setItemParameters([...itemParameters, newItemParams])

        // Propagate change to parent
        onDataChange?.({ inputParam, newValue: updatedArrayItems })
    }, [arrayItems, itemParameters, inputParam, onDataChange])

    // Delete array item
    const handleDeleteItem = useCallback(
        (indexToDelete: number) => {
            const updatedArrayItems = arrayItems.filter((_, i) => i !== indexToDelete)
            const updatedItemParameters = itemParameters.filter((_, i) => i !== indexToDelete)

            setArrayItems(updatedArrayItems)
            setItemParameters(updatedItemParameters)

            // Propagate change to parent
            onDataChange?.({ inputParam, newValue: updatedArrayItems })
        },
        [arrayItems, itemParameters, inputParam, onDataChange]
    )

    // Check if item can be deleted based on minItems constraint
    const canDeleteItem = !minItems || arrayItems.length > minItems

    return (
        <>
            {/* Render each array item */}
            {arrayItems.map((itemValues, index) => {
                // Create item-specific data context for nested NodeInputHandler
                const itemData: NodeData = {
                    ...data,
                    inputValues: itemValues
                }

                return (
                    <Box
                        key={index}
                        sx={{
                            p: 2,
                            mt: 2,
                            mb: 1,
                            border: 1,
                            borderColor: theme.palette.grey[300],
                            borderRadius: 2,
                            position: 'relative'
                        }}
                    >
                        {/* Delete button */}
                        <IconButton
                            title='Delete'
                            onClick={() => handleDeleteItem(index)}
                            disabled={disabled || !canDeleteItem}
                            sx={{
                                position: 'absolute',
                                height: 35,
                                width: 35,
                                right: 10,
                                top: 10,
                                '&:hover': { color: theme.palette.error.main },
                                ...(!canDeleteItem && {
                                    opacity: 0.3,
                                    cursor: 'not-allowed'
                                })
                            }}
                        >
                            <IconTrash />
                        </IconButton>

                        {/* Index chip */}
                        <Chip label={`${index}`} size='small' sx={{ position: 'absolute', right: 55, top: 16 }} />

                        {/* Render input fields for array item */}
                        {itemParameters[index]
                            ?.filter((param) => param.display !== false)
                            .map((param, paramIndex) => (
                                <NodeInputHandler
                                    key={paramIndex}
                                    inputParam={param}
                                    data={itemData}
                                    disabled={disabled}
                                    isAdditionalParams={true}
                                    disablePadding={false}
                                    onDataChange={({ inputParam: changedParam, newValue }) => {
                                        handleItemInputChange(index, changedParam, newValue)
                                    }}
                                />
                            ))}
                    </Box>
                )
            })}

            {/* Add item button */}
            <Button
                fullWidth
                size='small'
                variant='outlined'
                disabled={disabled}
                sx={{ borderRadius: '16px', mt: 2 }}
                startIcon={<IconPlus />}
                onClick={handleAddItem}
            >
                Add {inputParam.label}
            </Button>
        </>
    )
}

export default ArrayInput
